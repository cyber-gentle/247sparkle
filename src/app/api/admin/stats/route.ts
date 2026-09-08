import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  if (request.headers.get('x-user-role') !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 14-day window for the revenue chart (inclusive of today).
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

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
      revenueWindowOrders,
      serviceDistribution,
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
          assignedOrders: {
            some: { status: { in: ['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] } },
          },
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
      prisma.order.findMany({
        where: { createdAt: { gte: fourteenDaysAgo } },
        select: { createdAt: true, totalAmount: true, paymentStatus: true },
      }),
      prisma.order.groupBy({
        by: ['serviceType'],
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
    ]);

    const completionRate =
      totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0.0';

    // Bucket the 14-day window into one entry per day (zeros included, so the
    // chart shows quiet days rather than gaps). Revenue counts PAID orders
    // only, matching the revenueToday KPI.
    const revenueSeries: { day: string; revenue: number; orders: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const dayStart = new Date(fourteenDaysAgo);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayOrders = revenueWindowOrders.filter(
        (o) => o.createdAt >= dayStart && o.createdAt < dayEnd
      );
      revenueSeries.push({
        day: dayStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        revenue: dayOrders
          .filter((o) => o.paymentStatus === 'PAID')
          .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0),
        orders: dayOrders.length,
      });
    }

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
      revenueSeries,
      serviceDistribution: serviceDistribution.map((s) => ({
        service: s.serviceType.replace(/_/g, ' '),
        orders: s._count._all,
        revenue: s._sum.totalAmount ?? 0,
      })),
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
