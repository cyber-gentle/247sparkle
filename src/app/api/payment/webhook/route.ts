import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { confirmOrderPayment } from '@/lib/payments';

// Paystack webhook — the source of truth for payment confirmation.
// Paystack signs the raw request body with HMAC-SHA512 using the secret key
// and sends the hex digest in the x-paystack-signature header.
// https://paystack.com/docs/payments/webhooks/

export const runtime = 'nodejs';

function isValidSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;

  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(signature, 'utf8');
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

export async function POST(request: NextRequest) {
  // Read the raw body BEFORE parsing — the signature is over the exact bytes.
  const rawBody = await request.text();

  if (!isValidSignature(rawBody, request.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: {
    event?: string;
    data?: { reference?: string; amount?: number; currency?: string; status?: string };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Only charge.success flips orders to PAID; acknowledge everything else so
  // Paystack doesn't keep retrying events we don't handle.
  if (event.event !== 'charge.success' || !event.data?.reference) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { paystackReference: event.data.reference },
    });

    if (!order) {
      // Unknown reference — acknowledge (200) so Paystack stops retrying,
      // but log it for investigation.
      console.error(`Webhook: no order for reference ${event.data.reference}`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const result = await confirmOrderPayment(order, {
      reference: event.data.reference,
      amount: event.data.amount ?? -1,
      currency: event.data.currency,
      status: event.data.status ?? 'success',
    });

    if (!result.ok) {
      // Mismatch is logged inside confirmOrderPayment. Acknowledge so Paystack
      // doesn't retry — retrying won't fix an amount mismatch.
      return NextResponse.json({ received: true }, { status: 200 });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // 500 → Paystack will retry, which is what we want for transient DB errors.
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
