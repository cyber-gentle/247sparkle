import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  rider: {
    findUnique: vi.fn(),
  },
  order: {
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(),
}));

const orderIntegrity = vi.hoisted(() => ({
  assignRiderToPaidOrder: vi.fn(),
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
  assignRiderToPaidOrder: orderIntegrity.assignRiderToPaidOrder,
}));
vi.mock('@/lib/api-auth', () => ({ requireRole: authLib.requireRole }));
vi.mock('@/lib/api-rate-limit', () => ({
  rateLimitRequest: rateLimitLib.rateLimitRequest,
  RATE_LIMIT_POLICIES: rateLimitLib.RATE_LIMIT_POLICIES,
}));

import { PUT as assignRider } from '@/app/api/admin/orders/[id]/assign/route';

function adminSession() {
  authLib.requireRole.mockResolvedValue({
    ok: true,
    session: { userId: 'admin-user', email: 'admin@test', role: 'ADMIN' },
  });
}

function request(orderId: string, riderId: string) {
  return new NextRequest(`http://localhost/api/admin/orders/${orderId}/assign`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ riderId }),
  });
}

function params(orderId: string) {
  return { params: Promise.resolve({ id: orderId }) };
}

describe('Admin manual rider assignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminSession();
  });

  it('assigns an approved rider to a paid unassigned order', async () => {
    db.rider.findUnique.mockResolvedValue({ id: 'rider-1', approvalStatus: 'APPROVED' });
    db.order.findUnique.mockResolvedValue({
      id: 'order-1',
      paymentStatus: 'PAID',
      status: 'PAID_UNASSIGNED',
      riderId: null,
    });
    orderIntegrity.assignRiderToPaidOrder.mockResolvedValue({
      id: 'order-1',
      status: 'RIDER_ASSIGNED',
      rider: { id: 'rider-1', user: { fullName: 'Test Rider', phone: '08012345678' } },
    });

    const response = await assignRider(request('order-1', 'rider-1'), params('order-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.order.status).toBe('RIDER_ASSIGNED');
    expect(orderIntegrity.assignRiderToPaidOrder).toHaveBeenCalledWith({
      orderId: 'order-1',
      riderId: 'rider-1',
      actorUserId: 'admin-user',
    });
  });

  it('returns 404 for an unknown rider', async () => {
    db.rider.findUnique.mockResolvedValue(null);

    const response = await assignRider(request('order-1', 'rider-x'), params('order-1'));

    expect(response.status).toBe(404);
    expect(orderIntegrity.assignRiderToPaidOrder).not.toHaveBeenCalled();
  });

  it('refuses to assign a rider who is not approved', async () => {
    db.rider.findUnique.mockResolvedValue({ id: 'rider-1', approvalStatus: 'PENDING' });

    const response = await assignRider(request('order-1', 'rider-1'), params('order-1'));

    expect(response.status).toBe(400);
    expect(orderIntegrity.assignRiderToPaidOrder).not.toHaveBeenCalled();
  });

  it('returns 409 when the order already has a rider', async () => {
    db.rider.findUnique.mockResolvedValue({ id: 'rider-1', approvalStatus: 'APPROVED' });
    db.order.findUnique.mockResolvedValue({
      id: 'order-1',
      paymentStatus: 'PAID',
      status: 'RIDER_ASSIGNED',
      riderId: 'rider-9',
    });

    const response = await assignRider(request('order-1', 'rider-1'), params('order-1'));

    expect(response.status).toBe(409);
    expect(orderIntegrity.assignRiderToPaidOrder).not.toHaveBeenCalled();
  });

  it('returns 409 for an unpaid order', async () => {
    db.rider.findUnique.mockResolvedValue({ id: 'rider-1', approvalStatus: 'APPROVED' });
    db.order.findUnique.mockResolvedValue({
      id: 'order-1',
      paymentStatus: 'UNPAID',
      status: 'PENDING',
      riderId: null,
    });

    const response = await assignRider(request('order-1', 'rider-1'), params('order-1'));

    expect(response.status).toBe(409);
    expect(orderIntegrity.assignRiderToPaidOrder).not.toHaveBeenCalled();
  });

  it('returns 409 when the atomic claim loses the race (concurrent self-accept)', async () => {
    db.rider.findUnique.mockResolvedValue({ id: 'rider-1', approvalStatus: 'APPROVED' });
    db.order.findUnique.mockResolvedValue({
      id: 'order-1',
      paymentStatus: 'PAID',
      status: 'PAID_UNASSIGNED',
      riderId: null,
    });
    // The pre-check passed, but another actor claimed it in between.
    orderIntegrity.assignRiderToPaidOrder.mockResolvedValue(null);

    const response = await assignRider(request('order-1', 'rider-1'), params('order-1'));

    expect(response.status).toBe(409);
  });

  it('returns 403 for a non-admin session', async () => {
    authLib.requireRole.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    });

    const response = await assignRider(request('order-1', 'rider-1'), params('order-1'));

    expect(response.status).toBe(403);
  });

  it('rejects a missing riderId with 400', async () => {
    const badRequest = new NextRequest('http://localhost/api/admin/orders/order-1/assign', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await assignRider(badRequest, params('order-1'));

    expect(response.status).toBe(400);
  });
});
