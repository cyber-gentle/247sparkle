import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db';

/**
 * GET /api/pricing - Get all pricing
 */
export async function GET() {
  try {
    const pricing = await prisma.pricing.findMany();
    return NextResponse.json({ pricing }, { status: 200 });
  } catch (error: any) {
    console.error('Get pricing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pricing - Update pricing (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Body must include updates array with id, unitPrice' },
        { status: 400 }
      );
    }

    // Update each pricing
    const updatedPricing = await Promise.all(
      updates.map(async (update: any) => {
        return await prisma.pricing.update({
          where: { id: update.id },
          data: { unitPrice: update.unitPrice },
        });
      })
    );

    return NextResponse.json(
      { message: 'Pricing updated successfully', pricing: updatedPricing },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update pricing error:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing' },
      { status: 500 }
    );
  }
}
