import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';
import { transitionPaidOrder } from '@/lib/order-integrity';

/**
 * PUT /api/partner/orders/[id]/ready - "Mark Ready for Pickup".
 *
 * The partner signals cleaning is complete: the order moves IN_CLEANING →
 * OUT_FOR_DELIVERY via the shared atomic transition, so the rider can deliver
 * it back to the customer. Only the partner the order was routed to can do
 * this, and only while the order is in cleaning at their shop.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateLimitRequest(request, 'partner-mutation', RATE_LIMIT_POLICIES.mutation);
  if (limited) return limited;

  const auth = await requireRole(request, ['PARTNER']);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const userId = auth.session.userId;

    const partner = await prisma.partner.findUnique({ where: { userId } });
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, partnerId: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.partnerId !== partner.id) {
      return NextResponse.json({ error: 'Forbidden - not your order' }, { status: 403 });
    }

    if (order.status !== 'IN_CLEANING') {
      return NextResponse.json(
        { error: 'Only orders currently in cleaning can be marked ready' },
        { status: 409 }
      );
    }

    const updatedOrder = await transitionPaidOrder({
      orderId: id,
      currentStatus: 'IN_CLEANING',
      nextStatus: 'OUT_FOR_DELIVERY',
      actorUserId: userId,
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order changed before it could be marked ready' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message: 'Order marked ready for pickup',
        order: { id: updatedOrder.id, status: updatedOrder.status },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Partner mark ready error:', error);
    return NextResponse.json({ error: 'Failed to mark order ready' }, { status: 500 });
  }
}
