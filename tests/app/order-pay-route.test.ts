import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  order: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

const authLib = vi.hoisted(() => ({
  requireRole: vi.fn(),
}));

const rateLimitLib = vi.hoisted(() => ({
  rateLimitRequest: vi.fn().mockResolvedValue(null),
  RATE_LIMIT_POLICIES: { mutation: {} },
}));

const paystack = vi.hoisted(() => ({ initializePayment: vi.fn(), verifyPayment: vi.fn() }));
const paymentConfirmation = vi.hoisted(() => vi.fn());

vi.mock('@/lib/db', () => ({ default: db }));
vi.mock('@/lib/api-auth', () => ({ requireRole: authLib.requireRole }));
vi.mock('@/lib/api-rate-limit', () => ({
  rateLimitRequest: rateLimitLib.rateLimitRequest,
  RATE_LIMIT_POLICIES: rateLimitLib.RATE_LIMIT_POLICIES,
}));
vi.mock('@/lib/paystack', () => ({
  initializePayment: paystack.initializePayment,
  verifyPayment: paystack.verifyPayment,
}));
vi.mock('@/lib/payments', () => ({ confirmOrderPayment: paymentConfirmation }));

import { POST } from '@/app/api/orders/[id]/pay/route';

const ORDER_ID = 'order-1';
const CUSTOMER_USER_ID = 'customer-user-1';

function unpaidOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: ORDER_ID,
    totalKobo: 150_000,
    paymentStatus: 'UNPAID',
    paystackReference: null,
    customerId: 'customer-1',
    customer: {
      userId: CUSTOMER_USER_ID,
      user: { email: 'customer@example.com' },
    },
    ...overrides,
  };
}

function payRequest(): NextRequest {
  return new NextRequest(`http://localhost:4028/api/orders/${ORDER_ID}/pay`, {
    method: 'POST',
  });
}

describe('POST /api/orders/[id]/pay (retry payment)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitLib.rateLimitRequest.mockResolvedValue(null);
    authLib.requireRole.mockResolvedValue({
      ok: true,
      session: { userId: CUSTOMER_USER_ID, role: 'CUSTOMER' },
    });
    db.order.update.mockResolvedValue({});
  });

  it('re-initializes payment for an unpaid order, stores the new reference, and returns the checkout URL', async () => {
    const order = unpaidOrder();
    db.order.findUnique.mockResolvedValue(order);
    paystack.initializePayment.mockResolvedValue({
      status: true,
      data: {
        authorization_url: 'https://checkout.paystack.test/authorize',
        access_code: 'access-code',
        reference: 'fresh-reference',
      },
    });

    const response = await POST(payRequest(), {
      params: Promise.resolve({ id: ORDER_ID }),
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      paymentUrl: 'https://checkout.paystack.test/authorize',
      reference: 'fresh-reference',
    });
    // Initialized at the stored server-side total, with the order-page
    // callback so the customer returns to a page that verifies the payment.
    expect(paystack.initializePayment).toHaveBeenCalledWith(
      'customer@example.com',
      150_000,
      expect.objectContaining({ orderId: ORDER_ID, customerId: 'customer-1' }),
      expect.stringContaining(`/customer/orders/${ORDER_ID}?payment=return`)
    );
    expect(db.order.update).toHaveBeenCalledWith({
      where: { id: ORDER_ID },
      data: { paystackReference: 'fresh-reference' },
    });
  });

  it('rejects another customer’s order', async () => {
    db.order.findUnique.mockResolvedValue(unpaidOrder({ customer: { userId: 'someone-else' } }));

    const response = await POST(payRequest(), {
      params: Promise.resolve({ id: ORDER_ID }),
    });

    expect(response.status).toBe(403);
    expect(paystack.initializePayment).not.toHaveBeenCalled();
  });

  it('refuses to re-initialize an already paid order', async () => {
    db.order.findUnique.mockResolvedValue(unpaidOrder({ paymentStatus: 'PAID' }));

    const response = await POST(payRequest(), {
      params: Promise.resolve({ id: ORDER_ID }),
    });

    expect(response.status).toBe(409);
    expect(paystack.initializePayment).not.toHaveBeenCalled();
    expect(db.order.update).not.toHaveBeenCalled();
  });

  it('re-verifies an existing reference and never double-charges a completed checkout', async () => {
    // Order looks UNPAID locally, but its earlier transaction succeeded at
    // Paystack (e.g. the return-path verify call failed transiently).
    db.order.findUnique.mockResolvedValue(
      unpaidOrder({ paystackReference: 'existing-reference' })
    );
    paystack.verifyPayment.mockResolvedValue({
      status: true,
      data: { reference: 'existing-reference', amount: 150_000, currency: 'NGN', status: 'success' },
    });
    paymentConfirmation.mockResolvedValue({ ok: true, alreadyProcessed: false, order: {} });

    const response = await POST(payRequest(), {
      params: Promise.resolve({ id: ORDER_ID }),
    });

    expect(response.status).toBe(409);
    expect(paystack.verifyPayment).toHaveBeenCalledWith('existing-reference');
    // The locally-UNPAID order gets reconciled via the shared confirmation
    // logic (amount/currency validated), not billed again.
    expect(paymentConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ id: ORDER_ID }),
      expect.objectContaining({ reference: 'existing-reference', status: 'success' })
    );
    expect(paystack.initializePayment).not.toHaveBeenCalled();
    expect(db.order.update).not.toHaveBeenCalled();
  });

  it('starts a fresh transaction when the existing reference was abandoned', async () => {
    db.order.findUnique.mockResolvedValue(
      unpaidOrder({ paystackReference: 'abandoned-reference' })
    );
    paystack.verifyPayment.mockResolvedValue({
      status: true,
      data: { reference: 'abandoned-reference', amount: 0, currency: 'NGN', status: 'abandoned' },
    });
    paystack.initializePayment.mockResolvedValue({
      status: true,
      data: {
        authorization_url: 'https://checkout.paystack.test/authorize',
        access_code: 'access-code',
        reference: 'fresh-reference',
      },
    });

    const response = await POST(payRequest(), {
      params: Promise.resolve({ id: ORDER_ID }),
    });

    expect(response.status).toBe(200);
    expect(paystack.initializePayment).toHaveBeenCalled();
    expect(db.order.update).toHaveBeenCalledWith({
      where: { id: ORDER_ID },
      data: { paystackReference: 'fresh-reference' },
    });
  });

  it('reports a provider failure without leaking Paystack payloads', async () => {
    db.order.findUnique.mockResolvedValue(unpaidOrder());
    paystack.initializePayment.mockRejectedValue(
      new Error('Failed to initialize payment: Invalid key')
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await POST(payRequest(), {
      params: Promise.resolve({ id: ORDER_ID }),
    });

    expect(response.status).toBe(502);
    const payload = await response.json();
    expect(payload).toEqual({ error: 'Failed to initialize payment' });
    expect(db.order.update).not.toHaveBeenCalled();
  });

  it('404s an unknown order', async () => {
    db.order.findUnique.mockResolvedValue(null);

    const response = await POST(payRequest(), {
      params: Promise.resolve({ id: ORDER_ID }),
    });

    expect(response.status).toBe(404);
  });
});
