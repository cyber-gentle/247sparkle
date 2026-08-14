import { confirmOrderPayment as confirmPaymentWithIntegrity } from '@/lib/order-integrity';

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
  payloadHash?: string;
};

export async function confirmOrderPayment(
  order: { id: string; totalKobo: number },
  tx: PaystackTransactionData,
  eventType: 'charge.success' | 'verification' = 'verification'
) {
  return confirmPaymentWithIntegrity(order, {
    reference: tx.reference,
    amountKobo: tx.amount,
    currency: tx.currency,
    status: tx.status,
    eventType,
    payloadHash: tx.payloadHash,
  });
}
