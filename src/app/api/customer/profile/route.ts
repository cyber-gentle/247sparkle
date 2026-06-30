import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

const updateProfileSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({
      customer: {
        id: customer.id,
        fullName: customer.user.fullName,
        email: customer.user.email,
        phone: customer.user.phone,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
      },
      select: {
        fullName: true,
        email: true,
        phone: true,
      },
    });

    return NextResponse.json({ customer: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
