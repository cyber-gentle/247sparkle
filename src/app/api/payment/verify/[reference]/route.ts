import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/paystack';
import { confirmOrderPayment } from '@/lib/payments';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const limited = await rateLimitRequest(
    request,
    'payment-verification',
    RATE_LIMIT_POLICIES.paymentVerification
  );
  if (limited) return limited;

  const auth = await requireRole(request, ['CUSTOMER', 'ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const userId = auth.session.userId;
    const userRole = auth.session.role;

    const { reference } = await params;

    // Find order by Paystack reference
    const order = await prisma.order.findUnique({
      where: { paystackReference: reference },
      include: {
        customer: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isAuthorized =
      userRole === 'ADMIN' || (userRole === 'CUSTOMER' && order.customer.userId === userId);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Avoid repeated external verification once the order is already marked paid.
    if (order.paymentStatus === 'PAID') {
      const existingOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: true,
          customer: true,
        },
      });

      return NextResponse.json(
        {
          message: 'Payment already verified',
          order: existingOrder,
        },
        { status: 200 }
      );
    }

    // Verify payment with Paystack only after ownership/admin checks pass.
    // confirmOrderPayment also validates the paid amount and currency against
    // the order — Paystack's word alone is not enough, or an underpayment
    // would still flip the order to PAID.
    const paymentResult = await verifyPayment(reference);

    const result = await confirmOrderPayment(order, {
      reference,
      amount: paymentResult.data.amount,
      currency: paymentResult.data.currency,
      status: paymentResult.status ? paymentResult.data.status : 'failed',
    });

    if (!result.ok) {
      // Deliberately generic: don't echo Paystack payloads or mismatch details
      // back to the client.
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: 'Payment verified successfully',
        order: result.order,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to verify payment.' },
    { status: 405 }
  );
}
