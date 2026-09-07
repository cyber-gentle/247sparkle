import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';

/**
 * GET /api/admin/withdrawals - List withdrawal requests (admin only).
 * PENDING requests are returned first; status filter optional.
 */
export async function GET(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'admin-query', RATE_LIMIT_POLICIES.mutation);
  if (limited) return limited;

  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const status = request.nextUrl.searchParams.get('status');

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        rider: {
          select: {
            id: true,
            walletBalanceKobo: true,
            user: {
              select: { fullName: true, email: true, phone: true },
            },
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    // PENDING first (actionable), then everything else, newest first within groups.
    const rank = { PENDING: 0, APPROVED: 1, PAID: 2, REJECTED: 3 } as Record<string, number>;
    withdrawals.sort(
      (a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
    );

    return NextResponse.json({ withdrawals }, { status: 200 });
  } catch (error) {
    console.error('List withdrawals error:', error);
    return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
  }
}
