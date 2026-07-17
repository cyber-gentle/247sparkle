import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

const updateStatusSchema = z.object({
  status: z.enum(['RIDER_ASSIGNED', 'PICKED_UP', 'IN_CLEANING', 'OUT_FOR_DELIVERY', 'COMPLETED']),
});

/**
 * POST /api/orders/[id]/status - Update order status
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = updateStatusSchema.parse(body);

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id },
      include: { rider: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check authorization - rider updating their own order or admin
    if (userRole === 'RIDER') {
      if (order.rider?.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden - not your order' }, { status: 403 });
      }
    } else if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        customer: {
          include: {
            user: {
              select: { fullName: true, email: true, phone: true },
            },
          },
        },
        rider: {
          include: {
            user: {
              select: { fullName: true, email: true, phone: true },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Order status updated',
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
          updatedAt: updatedOrder.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update order status error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
