import { beforeEach, describe, expect, it, vi } from 'vitest';
import prisma from '@/lib/db';
import { authenticatedJsonRequest, createCustomer } from './helpers';

const paystack = vi.hoisted(() => ({ initializePayment: vi.fn() }));

vi.mock('@/lib/paystack', () => ({
  initializePayment: paystack.initializePayment,
}));

import { GET, POST } from '@/app/api/orders/route';

describe('database-backed customer order routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prices a laundry order on the server, persists exact kobo values, and stores the payment reference', async () => {
    const { user, customer } = await createCustomer();
    await prisma.pricing.create({
      data: { serviceType: 'LAUNDRY', itemName: 'Shirt', unitPrice: 2500, unitPriceKobo: 250_000 },
    });
    paystack.initializePayment.mockResolvedValue({
      status: true,
      message: 'Authorization URL created',
      data: {
        authorization_url: 'https://paystack.test/authorize',
        access_code: 'access-code',
        reference: 'test-order-reference',
      },
    });

    const response = await POST(
      await authenticatedJsonRequest(
        '/api/orders',
        {
          userId: user.id,
          email: user.email,
          role: 'CUSTOMER',
        },
        { serviceType: 'LAUNDRY', items: [{ itemName: 'Shirt', quantity: 2 }] }
      )
    );

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.order).toMatchObject({ totalAmount: 5000, reference: 'test-order-reference' });
    expect(paystack.initializePayment).toHaveBeenCalledWith(
      user.email,
      500_000,
      expect.objectContaining({ customerId: customer.id, orderId: payload.order.id })
    );

    const savedOrder = await prisma.order.findUnique({
      where: { id: payload.order.id },
      include: { items: true },
    });
    expect(savedOrder).toMatchObject({
      customerId: customer.id,
      paymentStatus: 'UNPAID',
      totalKobo: 500_000,
      totalAmount: 5000,
      paystackReference: 'test-order-reference',
    });
    expect(savedOrder?.items).toEqual([
      expect.objectContaining({
        itemName: 'Shirt',
        quantity: 2,
        unitPriceKobo: 250_000,
        subtotalKobo: 500_000,
      }),
    ]);
  });

  it('rejects an unknown laundry item without persisting a zero-priced order', async () => {
    const { user } = await createCustomer();

    const response = await POST(
      await authenticatedJsonRequest(
        '/api/orders',
        {
          userId: user.id,
          email: user.email,
          role: 'CUSTOMER',
        },
        { serviceType: 'LAUNDRY', items: [{ itemName: 'Unknown item', quantity: 1 }] }
      )
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'Unknown item: Unknown item' });
    expect(await prisma.order.count()).toBe(0);
    expect(paystack.initializePayment).not.toHaveBeenCalled();
  });

  it('keeps the created unpaid order retriable when payment initialization is unavailable', async () => {
    const { user } = await createCustomer();
    await prisma.pricing.create({
      data: { serviceType: 'LAUNDRY', itemName: 'Dress', unitPrice: 1500, unitPriceKobo: 150_000 },
    });
    paystack.initializePayment.mockRejectedValue(new Error('temporary provider failure'));

    const response = await POST(
      await authenticatedJsonRequest(
        '/api/orders',
        {
          userId: user.id,
          email: user.email,
          role: 'CUSTOMER',
        },
        { serviceType: 'LAUNDRY', items: [{ itemName: 'Dress', quantity: 1 }] }
      )
    );

    expect(response.status).toBe(202);
    const payload = await response.json();
    const savedOrder = await prisma.order.findUnique({ where: { id: payload.order.id } });
    expect(savedOrder).toMatchObject({
      paymentStatus: 'UNPAID',
      totalKobo: 150_000,
      paystackReference: null,
    });
  });

  it('returns only the signed-in customer’s orders', async () => {
    const first = await createCustomer({ fullName: 'First Customer' });
    const second = await createCustomer({ fullName: 'Second Customer' });
    await prisma.order.createMany({
      data: [
        {
          customerId: first.customer.id,
          serviceType: 'LAUNDRY',
          totalAmount: 1000,
          totalKobo: 100_000,
        },
        {
          customerId: second.customer.id,
          serviceType: 'LAUNDRY',
          totalAmount: 2000,
          totalKobo: 200_000,
        },
      ],
    });

    const response = await GET(
      await authenticatedJsonRequest(
        '/api/orders',
        { userId: first.user.id, email: first.user.email, role: 'CUSTOMER' },
        undefined,
        'GET'
      )
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.orders).toHaveLength(1);
    expect(payload.orders[0]).toMatchObject({ customerId: first.customer.id, totalKobo: 100_000 });
  });
});
