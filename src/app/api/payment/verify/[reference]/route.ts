import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/paystack';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const isAuthorized =
      userRole === 'ADMIN' ||
      (userRole === 'CUSTOMER' && order.customer.userId === userId);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
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
    const paymentResult = await verifyPayment(reference);

    if (!paymentResult.status || paymentResult.data.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment verification failed', data: paymentResult.data },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        status: 'RIDER_ASSIGNED', // Auto-assign or set to pending for admin review
      },
      include: {
        items: true,
        customer: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Payment verified successfully',
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to verify payment.' },
    { status: 405 }
  );
}
