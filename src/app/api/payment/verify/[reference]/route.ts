import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/paystack';
import { confirmOrderPayment } from '@/lib/payments';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reference } = await params;

    // Find order by Paystack reference
    const order = await prisma.order.findFirst({
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
