import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';
import { assignRiderToPaidOrder } from '@/lib/order-integrity';

const acceptJobSchema = z.object({
  orderId: z.string(),
});

/**
 * POST /api/riders/jobs/[id]/accept - Accept a job
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateLimitRequest(request, 'rider-assignment', RATE_LIMIT_POLICIES.mutation);
  if (limited) return limited;

  const auth = await requireRole(request, ['RIDER']);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const userId = auth.session.userId;

    const body = await request.json();
    const { orderId } = acceptJobSchema.parse(body);

    // Verify the job ID matches the URL parameter
    if (id !== orderId) {
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

    const updatedOrder = await assignRiderToPaidOrder({
      orderId,
      riderId: rider.id,
      actorUserId: userId,
    });

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order is no longer available' }, { status: 409 });
    }

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
