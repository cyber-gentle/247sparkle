import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

// Laundry jobs the assigned rider still needs to act on. COMPLETED/CANCELLED
// and later-stage partner work is history, not an actionable job.
const RIDER_ACTIVE_STATUSES = ['RIDER_ASSIGNED', 'PICKED_UP', 'IN_CLEANING', 'OUT_FOR_DELIVERY'];

/**
 * GET /api/riders/jobs - Dashboard payload for the rider portal: profile and
 * availability, their in-flight jobs, available (unassigned) jobs, and an
 * earnings summary — one fetch for the whole dashboard.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['RIDER']);
  if (!auth.ok) return auth.response;

  try {
    const userId = auth.session.userId;

    // Get rider
    const rider = await prisma.rider.findUnique({
      where: { userId },
      include: {
        user: {
          select: { fullName: true },
        },
      },
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
        serviceType: 'LAUNDRY', // Rider dispatch applies to laundry orders only
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

    // The rider's own in-flight jobs.
    const assignedOrders = await prisma.order.findMany({
      where: {
        riderId: rider.id,
        status: { in: RIDER_ACTIVE_STATUSES },
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                fullName: true,
                phone: true,
              },
            },
          },
        },
        items: true,
      },
      orderBy: { createdAt: 'asc' }, // Oldest first: act on what you accepted first
    });

    const [today, weekStart] = [
      new Date(new Date().setHours(0, 0, 0, 0)),
      new Date(new Date().setHours(0, 0, 0, 0)),
    ];
    weekStart.setDate(weekStart.getDate() - 7);

    const earnings = await prisma.commission.aggregate({
      where: {
        riderId: rider.id,
        createdAt: { gte: weekStart },
      },
      _sum: { amount: true },
    });
    const earningsToday = await prisma.commission.aggregate({
      where: {
        riderId: rider.id,
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    });

    const toJobDTO = (order: (typeof availableJobs)[number]) => ({
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
    });

    return NextResponse.json(
      {
        rider: {
          fullName: rider.user.fullName,
          approvalStatus: rider.approvalStatus,
          availabilityStatus: rider.availabilityStatus,
          walletBalance: rider.walletBalance,
        },
        earnings: {
          today: earningsToday._sum.amount ?? 0,
          thisWeek: earnings._sum.amount ?? 0,
          allTime: rider.walletBalance,
        },
        assignedJobs: assignedOrders.map((order) => ({
          ...toJobDTO(order),
          customer: {
            name: order.customer?.user.fullName || 'Unknown',
            phone: order.customer?.user.phone || '',
          },
        })),
        jobs: availableJobs.map(toJobDTO),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get rider jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
