import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rider = await prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    const [commissions, withdrawals] = await Promise.all([
      prisma.commission.findMany({
        where: { riderId: rider.id },
        include: {
          order: {
            select: {
              serviceType: true,
              totalAmount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.withdrawalRequest.findMany({
        where: { riderId: rider.id },
        orderBy: { requestedAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      commissions,
      withdrawals,
      walletBalance: rider.walletBalance,
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 });
  }
}
