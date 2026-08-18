import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  $transaction: vi.fn(),
  order: {
    findUnique: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({ default: database }));

import { assignRiderToPaidOrder, confirmOrderPayment } from '../../src/lib/order-integrity';

function createTransaction(overrides: Record<string, unknown> = {}) {
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
