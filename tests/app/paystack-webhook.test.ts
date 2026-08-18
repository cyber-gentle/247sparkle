import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  order: {
    findUnique: vi.fn(),
  },
}));
const paymentConfirmation = vi.hoisted(() => vi.fn());

vi.mock('@/lib/db', () => ({ default: database }));
vi.mock('@/lib/payments', () => ({ confirmOrderPayment: paymentConfirmation }));

import { POST } from '../../src/app/api/payment/webhook/route';

const TEST_SECRET = 'test-paystack-webhook-secret';

function signedWebhook(payload: Record<string, unknown>, signature = true): NextRequest {
  const rawBody = JSON.stringify(payload);
  const headers = new Headers({ 'content-type': 'application/json' });

  if (signature) {
    headers.set(
      'x-paystack-signature',
      crypto.createHmac('sha512', TEST_SECRET).update(rawBody).digest('hex')
    );
  }

  return new NextRequest('http://localhost:4028/api/payment/webhook', {
    method: 'POST',
    headers,
    body: rawBody,
  });
}

describe('Paystack webhook protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PAYSTACK_SECRET_KEY = TEST_SECRET;
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('rejects a webhook without a valid HMAC signature before database access', async () => {
    const response = await POST(
      signedWebhook({ event: 'charge.success', data: { reference: 'reference-1' } }, false)
    );

    expect(response.status).toBe(401);
    expect(database.order.findUnique).not.toHaveBeenCalled();
    expect(paymentConfirmation).not.toHaveBeenCalled();
  });

  it('accepts a valid successful event and sends its exact amount and currency to integrity checks', async () => {
    database.order.findUnique.mockResolvedValue({
      id: 'order-1',
      totalKobo: 125075,
      paymentStatus: 'UNPAID',
    });
    paymentConfirmation.mockResolvedValue({ ok: true, alreadyProcessed: false, order: {} });

    const response = await POST(
      signedWebhook({
        event: 'charge.success',
        data: {
          reference: 'reference-1',
          amount: 125075,
          currency: 'NGN',
          status: 'success',
        },
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(paymentConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'order-1', totalKobo: 125075 }),
      expect.objectContaining({
        reference: 'reference-1',
        amount: 125075,
        currency: 'NGN',
        status: 'success',
      }),
      'charge.success'
    );
  });

  it('acknowledges non-success events without attempting confirmation', async () => {
    const response = await POST(
      signedWebhook({ event: 'charge.failed', data: { reference: 'reference-1' } })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(database.order.findUnique).not.toHaveBeenCalled();
    expect(paymentConfirmation).not.toHaveBeenCalled();
  });

  it('acknowledges an unknown signed reference without confirming payment', async () => {
    database.order.findUnique.mockResolvedValue(null);

    const response = await POST(
      signedWebhook({
        event: 'charge.success',
        data: {
          reference: 'unknown-reference',
          amount: 125075,
          currency: 'NGN',
          status: 'success',
        },
      })
    );

    expect(response.status).toBe(200);
    expect(paymentConfirmation).not.toHaveBeenCalled();
  });
});
