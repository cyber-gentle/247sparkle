import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

/**
 * GET /api/riders/jobs - Get available jobs for a rider
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['RIDER']);
  if (!auth.ok) return auth.response;

  try {
    const userId = auth.session.userId;

    // Get rider
    const rider = await prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    // Fetch available orders (not yet assigned to a rider, payment completed)
    const availableJobs = await prisma.order.findMany({
      where: {
        status: 'PAID_UNASSIGNED',
        paymentStatus: 'PAID',
        riderId: null, // No rider assigned yet
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to 20 most recent jobs
    });

    return NextResponse.json(
      {
        jobs: availableJobs.map((order) => ({
          id: order.id,
          orderNumber: `ORD-${order.id.slice(0, 6).toUpperCase()}`,
          serviceType: order.serviceType,
          status: order.status,
          totalAmount: order.totalAmount,
          pickupAddress: order.pickupAddress,
          deliveryAddress: order.deliveryAddress,
          scheduledDate: order.scheduledDate,
          customer: {
            id: order.customer?.user.fullName || 'Unknown',
            phone: order.customer?.user.phone || '',
            email: order.customer?.user.email || '',
          },
          itemCount: order.items?.length || 0,
          createdAt: order.createdAt,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get available jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
