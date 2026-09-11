import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';
import { transitionPaidOrder } from '@/lib/order-integrity';
import { notifyOrderStatusChange } from '@/lib/order-notifications';
import {
  canTransitionOrder,
  LAUNDRY_FULFILMENT_STATUSES,
  ON_SITE_STATUSES,
  type OrderStatus,
} from '@/lib/order-state';

// SCHEDULED / IN_PROGRESS are the on-site track (fumigation, cleaning);
// PICKED_UP → OUT_FOR_DELIVERY is the laundry track. COMPLETED is shared.
const updateStatusSchema = z.object({
  status: z.enum([
    'PICKED_UP',
    'IN_CLEANING',
    'OUT_FOR_DELIVERY',
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
  ]),
});

/**
 * POST /api/orders/[id]/status - Update order status
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateLimitRequest(
    request,
    'order-status-mutation',
    RATE_LIMIT_POLICIES.mutation
  );
  if (limited) return limited;

  const auth = await requireRole(request, ['RIDER', 'ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const userId = auth.session.userId;
    const userRole = auth.session.role;

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
      // Scheduling on-site services is an admin decision; riders only
      // progress laundry pickup/delivery steps.
      if ((ON_SITE_STATUSES as readonly string[]).includes(status)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // The two fulfilment tracks are mutually exclusive per service type.
    const isLaundry = order.serviceType === 'LAUNDRY';
    if (isLaundry && (ON_SITE_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json(
        { error: 'Laundry orders follow the pickup and delivery track' },
        { status: 400 }
      );
    }
    if (!isLaundry && (LAUNDRY_FULFILMENT_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json(
        { error: 'On-site service orders follow the schedule and visit track' },
        { status: 400 }
      );
    }

    if (!canTransitionOrder(order.status, status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${order.status} to ${status}` },
        { status: 409 }
      );
    }

    const updatedOrder = await transitionPaidOrder({
      orderId: id,
      currentStatus: order.status,
      nextStatus: status as OrderStatus,
      actorUserId: userId,
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order changed before status could be updated' },
        { status: 409 }
      );
    }

    // Best-effort: the transition is already committed, so a notification
    // failure must never turn a successful update into an error response.
    await notifyOrderStatusChange(id, status as OrderStatus);

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
