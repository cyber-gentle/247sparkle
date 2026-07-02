import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  if (request.headers.get('x-user-role') !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      ordersToday,
      revenueToday,
      activeRiders,
      onJobRiders,
      pendingRiderApprovals,
      pendingPartnerApprovals,
      totalPartners,
      availablePartners,
      totalOrders,
      completedOrders,
      recentOrders,
      pendingRiders,
      pendingPartners,
      recentQuotations,
      riderStatuses,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: today }, paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.rider.count({ where: { approvalStatus: 'APPROVED', availabilityStatus: 'WORKING' } }),
      prisma.rider.count({
        where: {
          approvalStatus: 'APPROVED',
          assignedOrders: { some: { status: { in: ['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] } } },
        },
      }),
      prisma.rider.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.partner.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.partner.count({ where: { approvalStatus: 'APPROVED' } }),
      prisma.partner.count({ where: { approvalStatus: 'APPROVED', workloadStatus: 'AVAILABLE' } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { include: { user: { select: { fullName: true } } } },
          rider: { include: { user: { select: { fullName: true } } } },
          items: true,
        },
      }),
      prisma.rider.findMany({
        where: { approvalStatus: 'PENDING' },
        include: { user: { select: { fullName: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.partner.findMany({
        where: { approvalStatus: 'PENDING' },
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.quotation.findMany({
        where: { status: 'NEW' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.rider.findMany({
        where: { approvalStatus: 'APPROVED' },
        include: {
          user: { select: { fullName: true } },
          assignedOrders: {
            where: { status: { in: ['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] } },
            select: { id: true },
          },
          commissions: {
            where: { createdAt: { gte: today } },
            select: { amount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
    ]);

    const completionRate =
      totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      kpis: {
        ordersToday,
        revenueToday: revenueToday._sum.totalAmount ?? 0,
        activeRiders,
        onJobRiders,
        pendingApprovals: pendingRiderApprovals + pendingPartnerApprovals,
        pendingRiderApprovals,
        pendingPartnerApprovals,
        completionRate,
        totalPartners,
        availablePartners,
      },
      recentOrders,
      pendingRiders,
      pendingPartners,
      recentQuotations,
      riderStatuses,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
