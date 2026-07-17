import prisma from '@/lib/db';

/**
 * Shared payment confirmation logic used by both the customer-triggered
 * verify endpoint and the Paystack webhook. Validates that what Paystack
 * says was paid actually matches the order before marking it PAID.
 */
export type PaystackTransactionData = {
  reference: string;
  amount: number; // in kobo
  currency?: string;
  status: string;
};

export type ConfirmResult =
  | { ok: true; order: Awaited<ReturnType<typeof markOrderPaid>> }
  | { ok: false; reason: 'NOT_SUCCESS' | 'AMOUNT_MISMATCH' | 'CURRENCY_MISMATCH' };

function markOrderPaid(orderId: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'PAID',
      status: 'RIDER_ASSIGNED',
    },
    include: {
      items: true,
      customer: true,
    },
  });
}

export async function confirmOrderPayment(
  order: { id: string; totalAmount: number },
  tx: PaystackTransactionData
): Promise<ConfirmResult> {
  if (tx.status !== 'success') {
    return { ok: false, reason: 'NOT_SUCCESS' };
  }

  // Paystack amounts are in kobo; totalAmount is in naira.
  const expectedKobo = Math.round(order.totalAmount * 100);
  if (tx.amount !== expectedKobo) {
    console.error(
      `Payment amount mismatch for order ${order.id} (ref ${tx.reference}): expected ${expectedKobo} kobo, Paystack reports ${tx.amount}`
    );
    return { ok: false, reason: 'AMOUNT_MISMATCH' };
  }

  if (tx.currency && tx.currency !== 'NGN') {
    console.error(
      `Payment currency mismatch for order ${order.id} (ref ${tx.reference}): ${tx.currency}`
    );
    return { ok: false, reason: 'CURRENCY_MISMATCH' };
  }

  const updated = await markOrderPaid(order.id);
  return { ok: true, order: updated };
}
