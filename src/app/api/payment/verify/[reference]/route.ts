import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/paystack';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const reference = params.reference;

    // Verify payment with Paystack
    const paymentResult = await verifyPayment(reference);

    if (!paymentResult.status || paymentResult.data.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment verification failed', data: paymentResult.data },
        { status: 400 }
      );
    }

    // Find order by Paystack reference
    const order = await prisma.order.findFirst({
      where: { paystackReference: reference },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status to PAID
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
