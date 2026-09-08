import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  $transaction: vi.fn(),
  order: {
    findUnique: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({ default: database }));

import {
  assignRiderToPaidOrder,
  confirmOrderPayment,
  transitionPaidOrder,
} from '../../src/lib/order-integrity';

type TransactionMock = {
  paymentEvent: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  order: { updateMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
  commission: {
    upsert: ReturnType<typeof vi.fn>;
    findUnique?: ReturnType<typeof vi.fn>;
    create?: ReturnType<typeof vi.fn>;
  };
  auditLog: { create: ReturnType<typeof vi.fn> };
  rider?: { update: ReturnType<typeof vi.fn> };
  [key: string]: unknown;
};

function createTransaction(overrides: Record<string, unknown> = {}): TransactionMock {
  return {
    paymentEvent: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'event-1' }),
    },
    order: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn().mockResolvedValue({
        id: 'order-1',
        totalKobo: 125075,
        paymentStatus: 'PAID',
        status: 'PAID_UNASSIGNED',
        customer: {},
      }),
    },
    commission: {
      upsert: vi.fn().mockResolvedValue({ id: 'commission-1' }),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
    },
    ...overrides,
  };
}
describe('Phase 2 order integrity service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('treats an already-recorded payment event as an idempotent replay', async () => {
    const tx = createTransaction({
      paymentEvent: { findUnique: vi.fn().mockResolvedValue({ id: 'event-1' }), create: vi.fn() },
    });
    database.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => unknown) => callback(tx)
    );

    const result = await confirmOrderPayment(
      { id: 'order-1', totalKobo: 125075 },
      {
        reference: 'payment-reference',
        amountKobo: 125075,
        status: 'success',
        currency: 'NGN',
        eventType: 'charge.success',
      }
    );

    expect(result).toMatchObject({ ok: true, alreadyProcessed: true });
    expect(tx.paymentEvent.create).not.toHaveBeenCalled();
    expect(tx.order.updateMany).not.toHaveBeenCalled();
  });

  it('records and confirms an exact successful NGN payment only once', async () => {
    const tx = createTransaction();
    database.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => unknown) => callback(tx)
    );

    const result = await confirmOrderPayment(
      { id: 'order-1', totalKobo: 125075 },
      {
        reference: 'payment-reference',
        amountKobo: 125075,
        status: 'success',
        currency: 'NGN',
        eventType: 'verification',
      }
    );

    expect(result).toMatchObject({ ok: true, alreadyProcessed: false });
    expect(tx.paymentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reference: 'payment-reference',
          eventType: 'verification',
          orderId: 'order-1',
        }),
      })
    );
    expect(tx.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order-1', paymentStatus: { not: 'PAID' } },
      })
    );
  });

  it.each([
    ['failed', 125075, 'NGN', 'NOT_SUCCESS'],
    ['success', 125074, 'NGN', 'AMOUNT_MISMATCH'],
    ['success', 125075, 'USD', 'CURRENCY_MISMATCH'],
  ] as const)(
    'rejects %s payments with %s before opening a transaction',
    async (status, amountKobo, currency, reason) => {
      const result = await confirmOrderPayment(
        { id: 'order-1', totalKobo: 125075 },
        {
          reference: 'payment-reference',
          amountKobo,
          status,
          currency,
          eventType: 'verification',
        }
      );

      expect(result).toEqual({ ok: false, reason });
      expect(database.$transaction).not.toHaveBeenCalled();
    }
  );

  it('allows exactly one rider to atomically claim the same paid order', async () => {
    const tx = createTransaction();
    tx.order.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    database.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => unknown) => callback(tx)
    );

    const [firstAttempt, secondAttempt] = await Promise.all([
      assignRiderToPaidOrder({ orderId: 'order-1', riderId: 'rider-a', actorUserId: 'user-a' }),
      assignRiderToPaidOrder({ orderId: 'order-1', riderId: 'rider-b', actorUserId: 'user-b' }),
    ]);

    expect([firstAttempt, secondAttempt].filter(Boolean)).toHaveLength(1);
    expect(tx.commission.upsert).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
  });
});

describe('Partner auto-routing on pickup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // A transaction whose order.findUnique responds appropriately for a
  // PICKED_UP transition: the final call returns the updated order.
  function createPickupTransaction({
    availablePartners = [{ id: 'partner-1', _count: { assignedOrders: 0 } }],
    routeCount = 1,
  }: {
    availablePartners?: Array<{ id: string; _count: { assignedOrders: number } }>;
    routeCount?: number;
  } = {}): TransactionMock & {
    partner: { findMany: ReturnType<typeof vi.fn> };
    order: { updateMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
  } {
    return createTransaction({
      partner: {
        findMany: vi.fn().mockResolvedValue(availablePartners),
      },
      order: {
        updateMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 1 }) // guarded status transition
          .mockResolvedValueOnce({ count: routeCount }), // guarded partner routing
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: 'order-1', status: 'PICKED_UP', partnerId: 'partner-1' }),
      },
    }) as TransactionMock & {
      partner: { findMany: ReturnType<typeof vi.fn> };
    };
  }

  it('routes a picked-up order to the partner with fewest active orders', async () => {
    const tx = createPickupTransaction();
    database.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => unknown) => callback(tx)
    );

    const result = await transitionPaidOrder({
      orderId: 'order-1',
      currentStatus: 'RIDER_ASSIGNED',
      nextStatus: 'PICKED_UP',
      actorUserId: 'user-rider',
    });

    expect(result).toMatchObject({ id: 'order-1', status: 'PICKED_UP' });
    // Queries APPROVED + AVAILABLE partners only.
    expect(tx.partner.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { approvalStatus: 'APPROVED', workloadStatus: 'AVAILABLE' },
      })
    );
    // Routing is guarded on partnerId: null.
    expect(tx.order.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { id: 'order-1', partnerId: null } })
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'PARTNER_AUTO_ASSIGNED' }),
      })
    );
  });

  it('picks the partner with fewer active orders when several are available', async () => {
    const tx = createPickupTransaction({
      availablePartners: [
        { id: 'partner-a', _count: { assignedOrders: 3 } },
        { id: 'partner-b', _count: { assignedOrders: 1 } },
        { id: 'partner-c', _count: { assignedOrders: 5 } },
      ],
    });
    database.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => unknown) => callback(tx)
    );

    await transitionPaidOrder({
      orderId: 'order-1',
      currentStatus: 'RIDER_ASSIGNED',
      nextStatus: 'PICKED_UP',
      actorUserId: 'user-rider',
    });

    expect(tx.order.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ data: { partnerId: 'partner-b' } })
    );
  });

  it('leaves the order unrouted when no partner is available', async () => {
    const tx = createPickupTransaction({ availablePartners: [] });
    database.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => unknown) => callback(tx)
    );

    const result = await transitionPaidOrder({
      orderId: 'order-1',
      currentStatus: 'RIDER_ASSIGNED',
      nextStatus: 'PICKED_UP',
      actorUserId: 'user-rider',
    });

    expect(result).toMatchObject({ status: 'PICKED_UP' });
    // No second (routing) updateMany, no auto-assign audit entry.
    expect(tx.order.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1); // status change only
  });

  it('does not overwrite a manual routing that landed first', async () => {
    const tx = createPickupTransaction({ routeCount: 0 });
    database.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => unknown) => callback(tx)
    );

    await transitionPaidOrder({
      orderId: 'order-1',
      currentStatus: 'RIDER_ASSIGNED',
      nextStatus: 'PICKED_UP',
      actorUserId: 'user-rider',
    });

    // Routing attempt lost the race → no PARTNER_AUTO_ASSIGNED audit log.
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('does not route orders on non-pickup transitions', async () => {
    const tx = createPickupTransaction();
    database.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => unknown) => callback(tx)
    );

    await transitionPaidOrder({
      orderId: 'order-1',
      currentStatus: 'IN_CLEANING',
      nextStatus: 'OUT_FOR_DELIVERY',
      actorUserId: 'user-rider',
    });

    expect(tx.partner.findMany).not.toHaveBeenCalled();
    expect(tx.order.updateMany).toHaveBeenCalledTimes(1);
  });
});

describe('Rider wallet crediting on order completion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createCompletionTransaction({
    riderId = 'rider-1',
    commissionKobo = 25000,
    updateCount = 1,
  }: {
    riderId?: string | null;
    commissionKobo?: number | null;
    updateCount?: number;
  } = {}): TransactionMock & { rider: { update: ReturnType<typeof vi.fn> } } {
    return createTransaction({
      order: {
        updateMany: vi.fn().mockResolvedValue({ count: updateCount }),
        findUnique: vi.fn().mockImplementation((args) => {
          // First findUnique call: the completion credit lookup (select riderId).
          // Final call: the returned order.
          if (args?.select) {
            return Promise.resolve({ riderId, totalKobo: 125000 });
          }
          return Promise.resolve({ id: 'order-1', status: 'COMPLETED' });
        }),
      },
      commission: {
        upsert: vi.fn(),
        findUnique: vi.fn().mockResolvedValue(
          commissionKobo === null ? null : { amountKobo: commissionKobo }
        ),
        create: vi.fn().mockResolvedValue({ id: 'commission-new' }),
      },
      rider: {
        update: vi.fn().mockResolvedValue({ id: 'rider-1' }),
      },
      partner: {
        // PICKED_UP transitions now consult the partner pool; this fixture
        // tests completion crediting, so no partner gets routed.
        findMany: vi.fn().mockResolvedValue([]),
      },
    }) as TransactionMock & { rider: { update: ReturnType<typeof vi.fn> } };
  }

  it('credits the wallet with the commission amount when an order completes', async () => {
    const tx = createCompletionTransaction({ commissionKobo: 25000 });
    database.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => unknown) => callback(tx)
    );

    const result = await transitionPaidOrder({
      orderId: 'order-1',
      currentStatus: 'OUT_FOR_DELIVERY',
      nextStatus: 'COMPLETED',
      actorUserId: 'user-rider',
    });

    expect(result).toMatchObject({ id: 'order-1', status: 'COMPLETED' });
    expect(tx.commission.findUnique).toHaveBeenCalledWith({
      where: { orderId_riderId: { orderId: 'order-1', riderId: 'rider-1' } },
      select: { amountKobo: true },
    });
    expect(tx.rider.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rider-1' },
        data: {
          walletBalanceKobo: { increment: 25000 },
          walletBalance: { increment: 250 },
        },
      })
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'RIDER_WALLET_CREDITED' }),
      })
    );
  });

  it('falls back to a 20% commission calculation when no commission row exists', async () => {
    const tx = createCompletionTransaction({ commissionKobo: null, riderId: 'rider-1' });
    database.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => unknown) => callback(tx)
    );

    await transitionPaidOrder({
      orderId: 'order-1',
      currentStatus: 'OUT_FOR_DELIVERY',
      nextStatus: 'COMPLETED',
      actorUserId: 'user-rider',
    });

    // 20% of 125000 kobo = 25000 kobo
    expect(tx.commission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amountKobo: 25000, riderId: 'rider-1', status: 'PENDING' }),
      })
    );
    expect(tx.rider.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { walletBalanceKobo: { increment: 25000 }, walletBalance: { increment: 250 } },
      })
    );
  });

  it('does not credit anything when the guarded transition loses the race', async () => {
    const tx = createCompletionTransaction({ updateCount: 0 });
    database.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => unknown) => callback(tx)
    );

    const result = await transitionPaidOrder({
      orderId: 'order-1',
      currentStatus: 'OUT_FOR_DELIVERY',
      nextStatus: 'COMPLETED',
      actorUserId: 'user-rider',
    });

    expect(result).toBeNull();
    expect(tx.rider.update).not.toHaveBeenCalled();
    expect(tx.commission.findUnique).not.toHaveBeenCalled();
  });

  it('does not credit anything for non-terminal transitions', async () => {
    const tx = createCompletionTransaction();
    database.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => unknown) => callback(tx)
    );

    await transitionPaidOrder({
      orderId: 'order-1',
      currentStatus: 'RIDER_ASSIGNED',
      nextStatus: 'PICKED_UP',
      actorUserId: 'user-rider',
    });

    expect(tx.rider.update).not.toHaveBeenCalled();
    expect(tx.commission.findUnique).not.toHaveBeenCalled();
  });
});
