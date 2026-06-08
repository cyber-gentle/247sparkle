import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * GET /api/admin/orders - Get all orders (admin only)
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

    const orders = await prisma.order.findMany({
      include: {
        customer: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        items: true,
        rider: {
          select: {
            user: { select: { fullName: true } },
          },
        },
        partner: {
          select: {
            businessName: true,
          },
        },
        certificate: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      { orders },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
