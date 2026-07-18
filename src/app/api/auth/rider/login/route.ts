import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/db';
import { signToken } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: { rider: true },
    });

    if (!user || user.role !== 'RIDER') {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password FIRST — revealing approval status before proving
    // knowledge of the password would let anyone enumerate rider accounts.
    const isValidPassword = await compare(validatedData.password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check rider approval status
    if (user.rider?.approvalStatus !== 'APPROVED') {
      return NextResponse.json(
        {
          error:
            'Your rider account is pending approval or has been suspended. Please contact support.',
        },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: 'RIDER',
    });

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Rider login error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
