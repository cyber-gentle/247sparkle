import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

const PAGE_SIZE = 50;

/**
 * GET /api/admin/orders - Get all orders (admin only), paginated.
 * Query params: page (1-based, default 1), status, serviceType
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const status = searchParams.get('status') ?? undefined;
    const serviceType = searchParams.get('serviceType') ?? undefined;

    const where = {
      ...(status ? { status } : {}),
      ...(serviceType ? { serviceType } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            include: {
              user: { select: { fullName: true, email: true, phone: true } },
            },
          },
          items: true,
          rider: { select: { user: { select: { fullName: true } } } },
          partner: { select: { businessName: true } },
          certificate: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ orders, total, page, pageSize: PAGE_SIZE }, { status: 200 });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
