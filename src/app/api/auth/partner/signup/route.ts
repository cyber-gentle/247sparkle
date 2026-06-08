import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/db';

const partnerSignupSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  address: z.string().min(5, 'Address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  openingTime: z.string().optional(), // HH:MM
  closingTime: z.string().optional(), // HH:MM
  daysOfOpening: z.array(z.string()).optional(), // ["Mon", "Tue", ...]
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = partnerSignupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(validatedData.password, 10);

    // Create user and partner
    const user = await prisma.user.create({
      data: {
        fullName: validatedData.businessName,
        email: validatedData.email,
        phone: validatedData.phone,
        passwordHash,
        role: 'PARTNER',
        partner: {
          create: {
            businessName: validatedData.businessName,
            ownerName: validatedData.ownerName,
            address: validatedData.address,
            openingTime: validatedData.openingTime,
            closingTime: validatedData.closingTime,
            daysOfOpening: validatedData.daysOfOpening || [],
            bankName: validatedData.bankName,
            bankCode: validatedData.bankCode,
            accountNumber: validatedData.accountNumber,
            accountName: validatedData.accountName,
            approvalStatus: 'PENDING', // Require admin approval
          },
        },
      },
      include: {
        partner: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Partner signup submitted. Pending admin approval.',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Partner signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Partner signup failed' },
      { status: 500 }
    );
  }
}
