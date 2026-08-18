import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { ZodError } from 'zod';
import prisma from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';
import { customerSignupSchema } from '@/lib/customer-signup-validation';

export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'auth', RATE_LIMIT_POLICIES.auth);
  if (limited) return limited;

  try {
    const body = await request.json();

    // Validate input
    const validatedData = customerSignupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await hash(validatedData.password, 10);

    // Create user and customer
    const user = await prisma.user.create({
      data: {
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        passwordHash,
        role: 'CUSTOMER',
        customer: {
          create: {},
        },
      },
      include: {
        customer: true,
      },
    });

    // Generate JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: 'CUSTOMER',
    });

    // Set auth cookie (server-side)
    const response = NextResponse.json(
      {
        message: 'Signup successful',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        },
      },
      { status: 201 }
    );

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}
