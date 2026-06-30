import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

const updateProfileSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  address: z.string().min(5),
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rider = await prisma.rider.findUnique({
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

    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    return NextResponse.json({
      rider: {
        id: rider.id,
        fullName: rider.user.fullName,
        email: rider.user.email,
        phone: rider.user.phone,
        address: rider.address,
        bankName: rider.bankName,
        bankCode: rider.bankCode,
        accountNumber: rider.accountNumber,
        accountName: rider.accountName,
        availabilityStatus: rider.availabilityStatus,
        approvalStatus: rider.approvalStatus,
      },
    });
  } catch (error) {
    console.error('Get rider profile error:', error);
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

    // Update user info
    await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: validatedData.fullName,
        phone: validatedData.phone,
      },
    });

    // Update rider info
    const rider = await prisma.rider.update({
      where: { userId },
      data: {
        address: validatedData.address,
        bankName: validatedData.bankName,
        bankCode: validatedData.bankCode,
        accountNumber: validatedData.accountNumber,
        accountName: validatedData.accountName,
      },
    });

    return NextResponse.json({ rider });
  } catch (error) {
    console.error('Update rider profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
