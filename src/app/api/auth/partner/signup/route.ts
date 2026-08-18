import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { ZodError } from 'zod';
import prisma from '@/lib/db';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';
import { partnerSignupRequestSchema } from '@/lib/provider-signup-validation';

export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'auth', RATE_LIMIT_POLICIES.auth);
  if (limited) return limited;

  try {
    const body = await request.json();
    const validatedData = partnerSignupRequestSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
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
            daysOfOpening: validatedData.daysOfOpening
              ? JSON.stringify(validatedData.daysOfOpening)
              : null,
            approvalStatus: 'PENDING',
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

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Partner signup failed' }, { status: 500 });
  }
}
