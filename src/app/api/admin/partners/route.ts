import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

const PAGE_SIZE = 50;

/**
 * GET /api/admin/partners - Get all partners (admin only), paginated.
 * Query params: page (1-based, default 1), approvalStatus
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const approvalStatus = searchParams.get('approvalStatus') ?? undefined;

    const where = approvalStatus ? { approvalStatus } : {};

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        include: {
          user: { select: { fullName: true, email: true, phone: true } },
          _count: { select: { commissions: true, assignedOrders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.partner.count({ where }),
    ]);

    return NextResponse.json({ partners, total, page, pageSize: PAGE_SIZE }, { status: 200 });
  } catch (error: any) {
    console.error('Get partners error:', error);
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }
}
