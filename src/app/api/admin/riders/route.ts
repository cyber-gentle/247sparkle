import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

/**
 * GET /api/admin/riders - Get all riders (admin only), paginated.
 * Query params: page (1-based, default 1), approvalStatus, availabilityStatus
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const approvalStatus = searchParams.get('approvalStatus') ?? undefined;
    const availabilityStatus = searchParams.get('availabilityStatus') ?? undefined;

    const where: { approvalStatus?: string; availabilityStatus?: string } = {};
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (availabilityStatus) where.availabilityStatus = availabilityStatus;

    const [riders, total] = await Promise.all([
      prisma.rider.findMany({
        where,
        include: {
          user: { select: { fullName: true, email: true, phone: true } },
          _count: { select: { commissions: true, assignedOrders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.rider.count({ where }),
    ]);

    return NextResponse.json(
      { riders, total, page, pageSize: PAGE_SIZE },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch (error: any) {
    console.error('Get riders error:', error);
    return NextResponse.json({ error: 'Failed to fetch riders' }, { status: 500 });
  }
}
