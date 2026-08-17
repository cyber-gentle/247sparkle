import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { nairaToKobo } from '@/lib/money';

const pricingUpdatesSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().min(1),
        unitPrice: z.number().finite().positive(),
      })
    )
    .min(1),
});

/**
 * GET /api/pricing - Get all pricing
 */
export async function GET() {
  try {
    const pricing = await prisma.pricing.findMany();
    return NextResponse.json({ pricing }, { status: 200 });
  } catch (error: any) {
    console.error('Get pricing error:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 });
  }
}

/**
 * PUT /api/pricing - Update pricing (admin only)
 */
export async function PUT(request: NextRequest) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const { updates } = pricingUpdatesSchema.parse(await request.json());

    // Update each pricing
    const updatedPricing = await Promise.all(
      updates.map(async (update) => {
        return await prisma.pricing.update({
          where: { id: update.id },
          data: {
            unitPrice: update.unitPrice,
            unitPriceKobo: nairaToKobo(update.unitPrice),
          },
        });
      })
    );

    return NextResponse.json(
      { message: 'Pricing updated successfully', pricing: updatedPricing },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update pricing error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid pricing update', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to update pricing' }, { status: 500 });
  }
}
