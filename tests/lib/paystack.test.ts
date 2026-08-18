import { beforeEach, describe, expect, it, vi } from 'vitest';

const paystackHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => paystackHttp),
  },
}));

import { initializePayment, verifyPayment } from '../../src/lib/paystack';

describe('Paystack client boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a non-positive or non-integer payment amount before any Paystack call', async () => {
    await expect(initializePayment('customer@example.com', 0)).rejects.toThrow(
      'Payment amount must be a positive integer kobo value'
    );
    await expect(initializePayment('customer@example.com', 1250.5)).rejects.toThrow(
      'Payment amount must be a positive integer kobo value'
    );

    expect(paystackHttp.post).not.toHaveBeenCalled();
  });

  it('initializes a transaction with server-calculated kobo and order metadata', async () => {
    const response = {
      status: true,
      message: 'Authorization URL created',
      data: {
        authorization_url: 'https://checkout.paystack.test/authorize',
        access_code: 'access-code',
        reference: 'reference-123',
      },
    };
    paystackHttp.post.mockResolvedValue({ data: response });

    await expect(
      initializePayment('customer@example.com', 125075, { orderId: 'order-1' })
    ).resolves.toEqual(response);

    expect(paystackHttp.post).toHaveBeenCalledWith('/transaction/initialize', {
      email: 'customer@example.com',
      amount: 125075,
      metadata: { orderId: 'order-1' },
    });
  });

  it('verifies by reference and reports a provider error without exposing provider payloads', async () => {
    paystackHttp.get.mockRejectedValue({
      response: { data: { message: 'Transaction not found' } },
      message: 'Request failed',
    });

    await expect(verifyPayment('missing-reference')).rejects.toThrow(
      'Failed to verify payment: Transaction not found'
    );
    expect(paystackHttp.get).toHaveBeenCalledWith('/transaction/verify/missing-reference');
  });
});
