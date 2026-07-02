import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

const updateProfileSchema = z.object({
  businessName: z.string().min(2),
  ownerName: z.string().min(2),
  phone: z.string().min(10),
  address: z.string().min(5),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  daysOfOpening: z.array(z.string()).optional(),
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const partner = await prisma.partner.findUnique({
      where: { userId },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
      },
    });

    if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

    return NextResponse.json({
      partner: {
        id: partner.id,
        businessName: partner.businessName,
        ownerName: partner.ownerName,
        email: partner.user.email,
        phone: partner.user.phone,
        address: partner.address,
        openingTime: partner.openingTime,
        closingTime: partner.closingTime,
        daysOfOpening: partner.daysOfOpening ? JSON.parse(partner.daysOfOpening) : [],
        bankName: partner.bankName,
        bankCode: partner.bankCode,
        accountNumber: partner.accountNumber,
        accountName: partner.accountName,
        approvalStatus: partner.approvalStatus,
        workloadStatus: partner.workloadStatus,
      },
    });
  } catch (error) {
    console.error('Get partner profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    await prisma.user.update({
      where: { id: userId },
      data: { fullName: data.businessName, phone: data.phone },
    });

    const partner = await prisma.partner.update({
      where: { userId },
      data: {
        businessName: data.businessName,
        ownerName: data.ownerName,
        address: data.address,
        openingTime: data.openingTime,
        closingTime: data.closingTime,
        daysOfOpening: data.daysOfOpening ? JSON.stringify(data.daysOfOpening) : undefined,
        bankName: data.bankName,
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
      },
    });

    return NextResponse.json({ partner });
  } catch (error) {
    console.error('Update partner profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
