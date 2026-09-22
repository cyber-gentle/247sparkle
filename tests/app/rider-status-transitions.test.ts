import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  order: {
    findUnique: vi.fn(),
  },
  certificate: {
    findUnique: vi.fn(),
  },
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

const notificationLib = vi.hoisted(() => ({
  notifyOrderStatusChange: vi.fn().mockResolvedValue(undefined),
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
vi.mock('@/lib/order-notifications', () => ({
  notifyOrderStatusChange: notificationLib.notifyOrderStatusChange,
}));

import { POST as updateOrderStatus } from '@/app/api/orders/[id]/status/route';

function riderSession(userId = 'rider-user') {
  authLib.requireRole.mockResolvedValue({
    ok: true,
    session: { userId, email: 'rider@test', role: 'RIDER' },
  });
}

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/orders/order-1/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function routeParams(id = 'order-1') {
  return { params: Promise.resolve({ id }) };
}

function sampleOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    serviceType: 'LAUNDRY',
    status: 'RIDER_ASSIGNED',
    paymentStatus: 'PAID',
    riderId: 'rider-1',
    partnerId: null,
    rider: { userId: 'rider-user' },
    ...overrides,
  };
}

describe('Rider order status transitions (/api/orders/[id]/status)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    riderSession();
  });

  it('allows rider to mark assigned order as PICKED_UP', async () => {
    db.order.findUnique.mockResolvedValue(sampleOrder({ status: 'RIDER_ASSIGNED' }));
    orderIntegrity.transitionPaidOrder.mockResolvedValue({ id: 'order-1', status: 'PICKED_UP' });

    const response = await updateOrderStatus(postRequest({ status: 'PICKED_UP' }), routeParams());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.order.status).toBe('PICKED_UP');
    expect(orderIntegrity.transitionPaidOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        currentStatus: 'RIDER_ASSIGNED',
        nextStatus: 'PICKED_UP',
      })
    );
  });

  it('rejects rider marking IN_CLEANING if partner has not been assigned yet', async () => {
    db.order.findUnique.mockResolvedValue(
      sampleOrder({
        status: 'PICKED_UP',
        partnerId: null,
      })
    );

    const response = await updateOrderStatus(postRequest({ status: 'IN_CLEANING' }), routeParams());
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/No partner shop has been assigned/i);
    expect(orderIntegrity.transitionPaidOrder).not.toHaveBeenCalled();
  });

  it('allows rider to mark IN_CLEANING once partner is assigned', async () => {
    db.order.findUnique.mockResolvedValue(
      sampleOrder({
        status: 'PICKED_UP',
        partnerId: 'partner-1',
      })
    );
    orderIntegrity.transitionPaidOrder.mockResolvedValue({ id: 'order-1', status: 'IN_CLEANING' });

    const response = await updateOrderStatus(postRequest({ status: 'IN_CLEANING' }), routeParams());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.order.status).toBe('IN_CLEANING');
  });

  it('strictly forbids rider from marking OUT_FOR_DELIVERY (only partner or admin can mark ready)', async () => {
    db.order.findUnique.mockResolvedValue(
      sampleOrder({
        status: 'IN_CLEANING',
        partnerId: 'partner-1',
      })
    );

    const response = await updateOrderStatus(
      postRequest({ status: 'OUT_FOR_DELIVERY' }),
      routeParams()
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toMatch(/Only the assigned partner or admin/i);
    expect(orderIntegrity.transitionPaidOrder).not.toHaveBeenCalled();
  });

  it('allows rider to mark COMPLETED when order is OUT_FOR_DELIVERY', async () => {
    db.order.findUnique.mockResolvedValue(
      sampleOrder({
        status: 'OUT_FOR_DELIVERY',
        partnerId: 'partner-1',
      })
    );
    orderIntegrity.transitionPaidOrder.mockResolvedValue({ id: 'order-1', status: 'COMPLETED' });

    const response = await updateOrderStatus(postRequest({ status: 'COMPLETED' }), routeParams());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.order.status).toBe('COMPLETED');
  });

  it('rejects riders updating orders assigned to other riders', async () => {
    db.order.findUnique.mockResolvedValue(
      sampleOrder({
        rider: { userId: 'different-rider' },
      })
    );

    const response = await updateOrderStatus(postRequest({ status: 'PICKED_UP' }), routeParams());
    expect(response.status).toBe(403);
    expect(orderIntegrity.transitionPaidOrder).not.toHaveBeenCalled();
  });
});
