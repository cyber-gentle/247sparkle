import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

const acceptJobSchema = z.object({
  orderId: z.string(),
});

/**
 * POST /api/riders/jobs/[id]/accept - Accept a job
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'RIDER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = acceptJobSchema.parse(body);

    // Verify the job ID matches the URL parameter
    if (params.id !== orderId) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    // Get rider
    const rider = await prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    // Check if rider is approved
    if (rider.approvalStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'Rider not approved to accept jobs' }, { status: 403 });
    }

    // Check if rider is available
    if (rider.availabilityStatus !== 'WORKING') {
      return NextResponse.json({ error: 'Rider is not available' }, { status: 400 });
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order is still available
    if (order.riderId !== null || order.status === 'COMPLETED' || order.paymentStatus !== 'PAID') {
      return NextResponse.json({ error: 'Order is no longer available' }, { status: 400 });
    }

    // Assign rider to order and update status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        riderId: rider.id,
        status: 'RIDER_ASSIGNED',
      },
      include: {
        customer: {
          include: {
            user: {
              select: { fullName: true, phone: true, email: true },
            },
          },
        },
        rider: {
          include: {
            user: {
              select: { fullName: true, phone: true, email: true },
            },
          },
        },
      },
    });

    // Create commission record for the rider
    await prisma.commission.create({
      data: {
        riderId: rider.id,
        orderId: orderId,
        amount: order.totalAmount * 0.15,
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      {
        message: 'Job accepted successfully',
        order: {
          id: updatedOrder.id,
          orderNumber: `ORD-${updatedOrder.id.slice(0, 6).toUpperCase()}`,
          status: updatedOrder.status,
          totalAmount: updatedOrder.totalAmount,
          customer: {
            name: updatedOrder.customer?.user.fullName,
            phone: updatedOrder.customer?.user.phone,
            address: updatedOrder.deliveryAddress,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Accept job error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to accept job' }, { status: 500 });
  }
}
