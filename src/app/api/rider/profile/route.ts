import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

const updateProfileSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  address: z.string().min(5),
  facePhotoUrl: z.string().optional(),
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['RIDER']);
  if (!auth.ok) return auth.response;

  try {
    const userId = auth.session.userId;

    const rider = await prisma.rider.findUnique({
      where: { userId },
      include: {
        user: {
          select: { fullName: true, email: true, phone: true },
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
        facePhotoUrl: rider.facePhotoUrl,
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
  const auth = await requireRole(request, ['RIDER']);
  if (!auth.ok) return auth.response;

  try {
    const userId = auth.session.userId;
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: validatedData.fullName,
        phone: validatedData.phone,
      },
    });

    const rider = await prisma.rider.update({
      where: { userId },
      data: {
        address: validatedData.address,
        facePhotoUrl: validatedData.facePhotoUrl,
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
