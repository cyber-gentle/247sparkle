import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import prisma from '@/lib/db';
import { consumePasswordResetToken } from '@/lib/password-reset';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

const FAILURE_MESSAGES = {
  INVALID: 'This reset link is invalid. Please request a new one.',
  EXPIRED: 'This reset link has expired. Please request a new one.',
  USED: 'This reset link has already been used. Please request a new one.',
} as const;

export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'auth', RATE_LIMIT_POLICIES.auth);
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }
    const validatedData = resetPasswordSchema.parse(body);

    const consumed = await consumePasswordResetToken(validatedData.token);

    if (!consumed.ok) {
      return NextResponse.json({ error: FAILURE_MESSAGES[consumed.reason] }, { status: 400 });
    }

    const newPasswordHash = await hash(validatedData.newPassword, 10);

    // The token was already consumed atomically, so even if this request is
    // replayed the reset endpoint rejects it — the password update itself is
    // idempotent.
    await prisma.user.update({
      where: { id: consumed.userId },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json(
      { message: 'Password updated successfully. You can now log in with your new password.' },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
