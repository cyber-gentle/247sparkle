import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

/**
 * GET /api/partner/orders - Orders routed to this partner for cleaning.
 *
 * Active orders first (newest first), then completed/cancelled history.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['PARTNER']);
  if (!auth.ok) return auth.response;

  try {
    const userId = auth.session.userId;

    const partner = await prisma.partner.findUnique({ where: { userId } });
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { partnerId: partner.id },
      include: {
        customer: {
          include: { user: { select: { fullName: true, phone: true } } },
        },
        items: true,
        rider: {
          include: { user: { select: { fullName: true, phone: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const ACTIVE_STATUSES = ['PICKED_UP', 'IN_CLEANING'];
    const active = orders
      .filter((o) => ACTIVE_STATUSES.includes(o.status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const history = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));

    const toDTO = (o: (typeof orders)[number]) => ({
      id: o.id,
      status: o.status,
      serviceType: o.serviceType,
      paymentStatus: o.paymentStatus,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
      // "Ready for pickup" is actionable while the items are still being
      // cleaned at the shop.
      canMarkReady: o.status === 'IN_CLEANING',
      customer: {
        name: o.customer?.user.fullName ?? 'Unknown',
        phone: o.customer?.user.phone ?? '',
      },
      rider: o.rider ? { name: o.rider.user.fullName, phone: o.rider.user.phone } : null,
      itemCount: o.items.length,
      items: o.items.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
      })),
    });

    return NextResponse.json({
      activeOrders: active.map(toDTO),
      orderHistory: history.map(toDTO),
      revenueThisMonth: orders
        .filter(
          (o) =>
            o.paymentStatus === 'PAID' &&
            o.createdAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        )
        .reduce((sum, o) => sum + o.totalAmount, 0),
    });
  } catch (error) {
    console.error('Get partner orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch partner orders' }, { status: 500 });
  }
}
