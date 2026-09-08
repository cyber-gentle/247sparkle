import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  partner: {
    findUnique: vi.fn(),
  },
  order: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

const orderIntegrity = vi.hoisted(() => ({
  transitionPaidOrder: vi.fn(),
}));

const authLib = vi.hoisted(() => ({
  requireRole: vi.fn(),
}));

const rateLimitLib = vi.hoisted(() => ({
  rateLimitRequest: vi.fn().mockResolvedValue(null),
  RATE_LIMIT_POLICIES: { mutation: {} },
}));

vi.mock('@/lib/db', () => ({ default: db }));
vi.mock('@/lib/order-integrity', () => ({
  transitionPaidOrder: orderIntegrity.transitionPaidOrder,
}));
vi.mock('@/lib/api-auth', () => ({ requireRole: authLib.requireRole }));
vi.mock('@/lib/api-rate-limit', () => ({
  rateLimitRequest: rateLimitLib.rateLimitRequest,
  RATE_LIMIT_POLICIES: rateLimitLib.RATE_LIMIT_POLICIES,
}));

import { PUT as assignPartner } from '@/app/api/admin/orders/[id]/assign-partner/route';
import { GET as getPartnerOrders } from '@/app/api/partner/orders/route';
import { PUT as markOrderReady } from '@/app/api/partner/orders/[id]/ready/route';

const NOW = new Date('2026-09-07T12:00:00Z');

function adminSession() {
  authLib.requireRole.mockResolvedValue({
    ok: true,
    session: { userId: 'admin-user', email: 'admin@test', role: 'ADMIN' },
  });
}

function partnerSession() {
  authLib.requireRole.mockResolvedValue({
    ok: true,
    session: { userId: 'partner-user', email: 'partner@test', role: 'PARTNER' },
  });
}

function putRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function routeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function eligibleOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    paymentStatus: 'PAID',
    status: 'PICKED_UP',
    riderId: 'rider-1',
    partnerId: null,
    ...overrides,
  };
}

// Runs the $transaction callback against a mock `tx` so the guarded
// updateMany/auditLog flow can be exercised end-to-end.
type TxMock = Record<string, unknown>;
function transactionWith(tx: TxMock) {
  db.$transaction.mockImplementation(async (fn: (tx: TxMock) => unknown) => fn(tx));
}

describe('Admin assign-partner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(NOW);
    adminSession();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('routes a picked-up paid order to an approved partner', async () => {
    db.partner.findUnique.mockResolvedValue({
      id: 'partner-1',
      approvalStatus: 'APPROVED',
    });
    db.order.findUnique.mockResolvedValue(eligibleOrder());
    transactionWith({
      order: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: 'order-1', status: 'PICKED_UP', partner: { id: 'partner-1', businessName: 'Sparkle Wash', workloadStatus: 'AVAILABLE' } }),
      },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    });

    const response = await assignPartner(
      putRequest('http://localhost/api/admin/orders/order-1/assign-partner', {
        partnerId: 'partner-1',
      }),
      routeParams('order-1')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.order.partner.businessName).toBe('Sparkle Wash');
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });

  it('returns 404 for an unknown partner', async () => {
    db.partner.findUnique.mockResolvedValue(null);

    const response = await assignPartner(
      putRequest('http://localhost/api/admin/orders/order-1/assign-partner', {
        partnerId: 'partner-x',
      }),
      routeParams('order-1')
    );

    expect(response.status).toBe(404);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('refuses a partner who is not approved', async () => {
    db.partner.findUnique.mockResolvedValue({ id: 'partner-1', approvalStatus: 'PENDING' });

    const response = await assignPartner(
      putRequest('http://localhost/api/admin/orders/order-1/assign-partner', {
        partnerId: 'partner-1',
      }),
      routeParams('order-1')
    );

    expect(response.status).toBe(400);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('returns 409 when the order is already routed to a partner', async () => {
    db.partner.findUnique.mockResolvedValue({ id: 'partner-2', approvalStatus: 'APPROVED' });
    db.order.findUnique.mockResolvedValue(eligibleOrder({ partnerId: 'partner-1' }));

    const response = await assignPartner(
      putRequest('http://localhost/api/admin/orders/order-1/assign-partner', {
        partnerId: 'partner-2',
      }),
      routeParams('order-1')
    );

    expect(response.status).toBe(409);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('returns 409 for an unpaid order or one without a rider', async () => {
    db.partner.findUnique.mockResolvedValue({ id: 'partner-1', approvalStatus: 'APPROVED' });
    db.order.findUnique.mockResolvedValue(eligibleOrder({ paymentStatus: 'UNPAID' }));

    const response = await assignPartner(
      putRequest('http://localhost/api/admin/orders/order-1/assign-partner', {
        partnerId: 'partner-1',
      }),
      routeParams('order-1')
    );

    expect(response.status).toBe(409);
  });

  it('returns 409 when a concurrent request routed the order first', async () => {
    db.partner.findUnique.mockResolvedValue({ id: 'partner-1', approvalStatus: 'APPROVED' });
    db.order.findUnique.mockResolvedValue(eligibleOrder());
    // Guarded updateMany finds nothing left to claim.
    transactionWith({
      order: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        findUnique: vi.fn(),
      },
      auditLog: { create: vi.fn() },
    });

    const response = await assignPartner(
      putRequest('http://localhost/api/admin/orders/order-1/assign-partner', {
        partnerId: 'partner-1',
      }),
      routeParams('order-1')
    );

    expect(response.status).toBe(409);
  });
});

function partnerOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-9',
    status: 'IN_CLEANING',
    serviceType: 'WASH_AND_FOLD',
    paymentStatus: 'PAID',
    totalAmount: 5000,
    partnerId: 'partner-1',
    createdAt: new Date('2026-09-05T10:00:00Z'),
    customer: { user: { fullName: 'Ada Obi', phone: '08012345678' } },
    rider: { user: { fullName: 'Musa Rider', phone: '08087654321' } },
    items: [{ itemName: 'Shirt', quantity: 3 }],
    ...overrides,
  };
}

describe('GET /api/partner/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(NOW);
    partnerSession();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('splits active from history and computes monthly revenue', async () => {
    db.partner.findUnique.mockResolvedValue({ id: 'partner-1' });
    db.order.findMany.mockResolvedValue([
      partnerOrder(),
      // OUT_FOR_DELIVERY → history
      partnerOrder({ id: 'order-8', status: 'OUT_FOR_DELIVERY', totalAmount: 3000 }),
      // Old month → history, excluded from revenue
      partnerOrder({
        id: 'order-7',
        status: 'COMPLETED',
        totalAmount: 2000,
        createdAt: new Date('2026-08-15T10:00:00Z'),
      }),
    ]);

    const response = await getPartnerOrders(new NextRequest('http://localhost/api/partner/orders'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.activeOrders).toHaveLength(1);
    expect(data.activeOrders[0].canMarkReady).toBe(true);
    expect(data.activeOrders[0].customer.name).toBe('Ada Obi');
    expect(data.activeOrders[0].itemCount).toBe(1);
    expect(data.orderHistory).toHaveLength(2);
    // Only the September PAID orders count: 5000 + 3000.
    expect(data.revenueThisMonth).toBe(8000);
  });

  it('returns 404 when no partner record exists for the user', async () => {
    db.partner.findUnique.mockResolvedValue(null);

    const response = await getPartnerOrders(new NextRequest('http://localhost/api/partner/orders'));

    expect(response.status).toBe(404);
  });
});

describe('PUT /api/partner/orders/[id]/ready', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    partnerSession();
  });

  it('marks an owned in-cleaning order ready for pickup', async () => {
    db.partner.findUnique.mockResolvedValue({ id: 'partner-1' });
    db.order.findUnique.mockResolvedValue({
      id: 'order-9',
      partnerId: 'partner-1',
      status: 'IN_CLEANING',
    });
    orderIntegrity.transitionPaidOrder.mockResolvedValue({
      id: 'order-9',
      status: 'OUT_FOR_DELIVERY',
    });

    const response = await markOrderReady(
      putRequest('http://localhost/api/partner/orders/order-9/ready', {}),
      routeParams('order-9')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.order.status).toBe('OUT_FOR_DELIVERY');
    expect(orderIntegrity.transitionPaidOrder).toHaveBeenCalledWith({
      orderId: 'order-9',
      currentStatus: 'IN_CLEANING',
      nextStatus: 'OUT_FOR_DELIVERY',
      actorUserId: 'partner-user',
    });
  });

  it('returns 403 when the order belongs to another partner', async () => {
    db.partner.findUnique.mockResolvedValue({ id: 'partner-1' });
    db.order.findUnique.mockResolvedValue({
      id: 'order-9',
      partnerId: 'partner-2',
      status: 'IN_CLEANING',
    });

    const response = await markOrderReady(
      putRequest('http://localhost/api/partner/orders/order-9/ready', {}),
      routeParams('order-9')
    );

    expect(response.status).toBe(403);
    expect(orderIntegrity.transitionPaidOrder).not.toHaveBeenCalled();
  });

  it('returns 409 when the order is not in cleaning', async () => {
    db.partner.findUnique.mockResolvedValue({ id: 'partner-1' });
    db.order.findUnique.mockResolvedValue({
      id: 'order-9',
      partnerId: 'partner-1',
      status: 'PICKED_UP',
    });

    const response = await markOrderReady(
      putRequest('http://localhost/api/partner/orders/order-9/ready', {}),
      routeParams('order-9')
    );

    expect(response.status).toBe(409);
    expect(orderIntegrity.transitionPaidOrder).not.toHaveBeenCalled();
  });

  it('returns 409 when the status changed before the transition', async () => {
    db.partner.findUnique.mockResolvedValue({ id: 'partner-1' });
    db.order.findUnique.mockResolvedValue({
      id: 'order-9',
      partnerId: 'partner-1',
      status: 'IN_CLEANING',
    });
    orderIntegrity.transitionPaidOrder.mockResolvedValue(null);

    const response = await markOrderReady(
      putRequest('http://localhost/api/partner/orders/order-9/ready', {}),
      routeParams('order-9')
    );

    expect(response.status).toBe(409);
  });
});
