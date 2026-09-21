import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        include: {
          user: { select: { fullName: true, email: true, phone: true, createdAt: true } },
          _count: { select: { orders: true } },
          orders: {
            select: { totalAmount: true, paymentStatus: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.customer.count(),
    ]);

    const result = customers.map((c) => {
      const totalSpend = c.orders
        .filter((o) => o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const lastOrderDate = c.orders[0]?.createdAt ? c.orders[0].createdAt.toISOString() : null;

      return {
        id: c.id,
        fullName: c.user.fullName,
        email: c.user.email,
        phone: c.user.phone ?? '—',
        joinedAt: c.user.createdAt.toISOString(),
        totalOrders: c._count.orders,
        totalSpend,
        lastOrderDate,
      };
    });

    return NextResponse.json({ customers: result, total, page, pageSize: PAGE_SIZE });
  } catch (error) {
    console.error('Admin customers error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
