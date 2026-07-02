import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  if (request.headers.get('x-user-role') !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const customers = await prisma.customer.findMany({
      include: {
        user: { select: { fullName: true, email: true, phone: true, createdAt: true } },
        orders: {
          select: { id: true, totalAmount: true, paymentStatus: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = customers.map((c) => ({
      id: c.id,
      fullName: c.user.fullName,
      email: c.user.email,
      phone: c.user.phone ?? '—',
      joinedAt: c.user.createdAt,
      totalOrders: c.orders.length,
      totalSpend: c.orders
        .filter((o) => o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + o.totalAmount, 0),
      lastOrderDate: c.orders[0]?.createdAt ?? null,
    }));

    return NextResponse.json({ customers: result });
  } catch (error) {
    console.error('Admin customers error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
