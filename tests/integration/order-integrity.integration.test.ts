import { describe, expect, it } from 'vitest';
import prisma from '@/lib/db';
import { assignRiderToPaidOrder, confirmOrderPayment } from '@/lib/order-integrity';
import { createCustomer, createPaidUnassignedOrder, createRider } from './helpers';

describe('database-backed order integrity', () => {
  it('records one ledger event and one audit event when the same payment settles concurrently', async () => {
    const { customer } = await createCustomer();
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        serviceType: 'LAUNDRY',
        totalAmount: 1250.75,
        totalKobo: 125_075,
      },
    });

    const payment = {
      reference: 'concurrent-payment-reference',
      amountKobo: 125_075,
      status: 'success',
      currency: 'NGN',
      eventType: 'charge.success' as const,
    };
    const outcomes = await Promise.all([
      confirmOrderPayment(order, payment),
      confirmOrderPayment(order, payment),
    ]);

    expect(outcomes.filter((outcome) => outcome.ok && !outcome.alreadyProcessed)).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.ok && outcome.alreadyProcessed)).toHaveLength(1);
    expect(await prisma.paymentEvent.count({ where: { reference: payment.reference } })).toBe(1);
    expect(
      await prisma.auditLog.count({ where: { action: 'PAYMENT_CONFIRMED', entityId: order.id } })
    ).toBe(1);
    expect(await prisma.order.findUnique({ where: { id: order.id } })).toMatchObject({
      paymentStatus: 'PAID',
      status: 'PAID_UNASSIGNED',
    });
  });

  it('allows one rider to atomically claim a paid unassigned order and creates one commission', async () => {
    const { customer } = await createCustomer();
    const order = await createPaidUnassignedOrder(customer.id, 100_000);
    const first = await createRider({ fullName: 'First Rider' });
    const second = await createRider({ fullName: 'Second Rider' });

    const claims = await Promise.all([
      assignRiderToPaidOrder({
        orderId: order.id,
        riderId: first.rider.id,
        actorUserId: first.user.id,
      }),
      assignRiderToPaidOrder({
        orderId: order.id,
        riderId: second.rider.id,
        actorUserId: second.user.id,
      }),
    ]);

    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(await prisma.commission.count({ where: { orderId: order.id } })).toBe(1);
    expect(
      await prisma.auditLog.count({ where: { action: 'RIDER_ASSIGNED', entityId: order.id } })
    ).toBe(1);
    expect(await prisma.order.findUnique({ where: { id: order.id } })).toMatchObject({
      status: 'RIDER_ASSIGNED',
      riderId: expect.any(String),
    });
  });
});
