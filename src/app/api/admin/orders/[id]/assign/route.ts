import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';
import { assignRiderToPaidOrder } from '@/lib/order-integrity';
import { notifyOrderStatusChange } from '@/lib/order-notifications';

const assignRiderSchema = z.object({
  riderId: z.string().min(1, 'riderId is required'),
});

/**
 * PUT /api/admin/orders/[id]/assign - Manually assign a rider to a paid,
 * unassigned order (admin only).
 *
 * The atomic claim inside assignRiderToPaidOrder guards against races and
 * double-assignment (riderId must still be null and the order must still be
 * PAID / PAID_UNASSIGNED), so a concurrent rider self-accept or a replayed
 * admin request simply returns 409.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateLimitRequest(request, 'admin-mutation', RATE_LIMIT_POLICIES.mutation);
  if (limited) return limited;

  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { riderId } = assignRiderSchema.parse(body);

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
    });

    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    if (rider.approvalStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Only approved riders can be assigned to orders' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, paymentStatus: true, status: true, riderId: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Pre-check for clearer errors; the transaction re-guards atomically.
    if (order.paymentStatus !== 'PAID' || order.status !== 'PAID_UNASSIGNED' || order.riderId) {
      return NextResponse.json(
        {
          error: order.riderId
            ? 'This order already has a rider assigned'
            : 'Only paid, unassigned orders can be assigned a rider',
        },
        { status: 409 }
      );
    }

    const updatedOrder = await assignRiderToPaidOrder({
      orderId: id,
      riderId,
      actorUserId: auth.session.userId,
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order is no longer available for assignment' },
        { status: 409 }
      );
    }

    // Best-effort customer notification; never fails a committed assignment.
    await notifyOrderStatusChange(id, 'RIDER_ASSIGNED');

    return NextResponse.json(
      {
        message: 'Rider assigned successfully',
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
          rider: updatedOrder.rider?.user
            ? {
                id: updatedOrder.rider.id,
                fullName: updatedOrder.rider.user.fullName,
                phone: updatedOrder.rider.user.phone,
              }
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin assign rider error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to assign rider' }, { status: 500 });
  }
}
