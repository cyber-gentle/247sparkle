import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

const availabilitySchema = z.object({
  availabilityStatus: z.enum(['WORKING', 'OFF_DUTY']),
});

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = availabilitySchema.parse(body);

    const rider = await prisma.rider.update({
      where: { userId },
      data: {
        availabilityStatus: validatedData.availabilityStatus,
      },
    });

    return NextResponse.json({ rider });
  } catch (error) {
    console.error('Update availability error:', error);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}
