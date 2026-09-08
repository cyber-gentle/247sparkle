import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';

const assignPartnerSchema = z.object({
  partnerId: z.string().min(1, 'partnerId is required'),
});

/**
 * PUT /api/admin/orders/[id]/assign-partner - Route an order to a laundry
 * partner for cleaning (admin only).
 *
 * Eligible orders have been picked up (a rider is assigned and the status is
 * PICKED_UP or IN_CLEANING), are paid, and have no partner yet. The guarded
 * updateMany makes the assignment atomic: a replayed or concurrent request
 * finds the order already routed and returns 409.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateLimitRequest(request, 'admin-mutation', RATE_LIMIT_POLICIES.mutation);
  if (limited) return limited;

  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { partnerId } = assignPartnerSchema.parse(body);

    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    if (partner.approvalStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Only approved partners can receive orders' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, paymentStatus: true, status: true, riderId: true, partnerId: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Pre-check for clearer errors; the transaction re-guards atomically.
    if (order.partnerId) {
      return NextResponse.json({ error: 'This order is already routed to a partner' }, { status: 409 });
    }
    if (order.paymentStatus !== 'PAID' || !order.riderId) {
      return NextResponse.json(
        { error: 'Only paid orders that have been picked up can be routed to a partner' },
        { status: 409 }
      );
    }
    if (!['PICKED_UP', 'IN_CLEANING'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Orders can only be routed to a partner while picked up or in cleaning' },
        { status: 409 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const assignment = await tx.order.updateMany({
        where: {
          id,
          partnerId: null,
          riderId: { not: null },
          paymentStatus: 'PAID',
          status: { in: ['PICKED_UP', 'IN_CLEANING'] },
        },
        data: { partnerId },
      });

      if (assignment.count !== 1) {
        return null;
      }

      await tx.auditLog.create({
        data: {
          action: 'PARTNER_ASSIGNED',
          entityType: 'ORDER',
          entityId: id,
          userId: auth.session.userId,
          changes: JSON.stringify({ partnerId }),
        },
      });

      return tx.order.findUnique({
        where: { id },
        include: {
          partner: {
            select: { id: true, businessName: true, workloadStatus: true },
          },
        },
      });
    });

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order is no longer available for routing' }, { status: 409 });
    }

    return NextResponse.json(
      {
        message: 'Order routed to partner successfully',
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
          partner: updatedOrder.partner,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin assign partner error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to assign partner' }, { status: 500 });
  }
}
