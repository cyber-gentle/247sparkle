import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * GET /api/admin/riders - Get all riders (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    const riders = await prisma.rider.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
        commissions: true,
        assignedOrders: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      { riders },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get riders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch riders' },
      { status: 500 }
    );
  }
}
