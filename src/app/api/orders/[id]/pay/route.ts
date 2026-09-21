import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';
import { initializePayment, verifyPayment } from '@/lib/paystack';
import { confirmOrderPayment } from '@/lib/payments';

/**
 * POST /api/orders/[id]/pay — (re-)initialize Paystack payment for an order.
 *
 * Covers the two dead ends the 202 path used to create: orders whose initial
 * payment initialization failed (no reference stored), and orders the customer
 * abandoned at checkout (reference stored, never paid). A fresh transaction is
 * initialized at the stored server-side total, the new reference replaces the
 * old one, and the authorization URL is returned for the client to redirect to.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateLimitRequest(request, 'order-mutation', RATE_LIMIT_POLICIES.mutation);
  if (limited) return limited;

  const auth = await requireRole(request, ['CUSTOMER']);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const userId = auth.session.userId;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.customer.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 409 });
    }

    if (!order.totalKobo || order.totalKobo <= 0) {
      return NextResponse.json({ error: 'Order has no payable amount' }, { status: 400 });
    }

    // Guard against double-charging: if a previous transaction exists, ask
    // Paystack about it first. An order can look UNPAID locally while its
    // checkout actually completed (e.g. the verify call failed transiently on
    // the way back) — re-initializing then would bill the customer twice.
    if (order.paystackReference) {
      try {
        const previous = await verifyPayment(order.paystackReference);
        if (previous.data.status === 'success') {
          await confirmOrderPayment(order, {
            reference: order.paystackReference,
            amount: previous.data.amount,
            currency: previous.data.currency,
            status: previous.data.status,
          });
          return NextResponse.json({ error: 'Order is already paid' }, { status: 409 });
        }
      } catch {
        // Reference unknown to Paystack (or transient provider error) —
        // safe to start a fresh transaction below.
      }
    }

    const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const dynamicBase = forwardedHost
      ? `${forwardedProto}://${forwardedHost.split(',')[0].trim()}`
      : (process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '') || request.nextUrl.origin);
    const callbackUrl = `${dynamicBase}/customer/orders/${order.id}?payment=return`;
    const paystackResponse = await initializePayment(
      order.customer.user.email,
      order.totalKobo,
      {
        orderId: order.id,
        customerId: order.customerId,
      },
      callbackUrl
    );

    await prisma.order.update({
      where: { id: order.id },
      data: { paystackReference: paystackResponse.data.reference },
    });

    return NextResponse.json(
      {
        message: 'Payment initialized successfully',
        paymentUrl: paystackResponse.data.authorization_url,
        reference: paystackResponse.data.reference,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Retry payment error:', error);
    return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 502 });
  }
}
