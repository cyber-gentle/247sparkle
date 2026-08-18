import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { ZodError } from 'zod';
import prisma from '@/lib/db';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';
import { riderSignupSchema } from '@/lib/provider-signup-validation';

export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'auth', RATE_LIMIT_POLICIES.auth);
  if (limited) return limited;

  try {
    const body = await request.json();
    const validatedData = riderSignupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await hash(validatedData.password, 10);

    // Create user and rider
    const user = await prisma.user.create({
      data: {
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        passwordHash,
        role: 'RIDER',
        rider: {
          create: {
            address: validatedData.address,
            approvalStatus: 'PENDING',
          },
        },
      },
      include: {
        rider: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Rider signup submitted. Pending admin approval.',
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
    console.error('Rider signup error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Rider signup failed' }, { status: 500 });
  }
}
