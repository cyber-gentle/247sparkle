import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { signToken, verifyPendingTwoFactorToken } from '@/lib/auth';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';
import {
  TWO_FACTOR_LOCKOUT_MINUTES,
  TWO_FACTOR_LOCKOUT_THRESHOLD,
  decryptTotpSecret,
  verifyTotpCode,
} from '@/lib/two-factor';

const twoFactorSchema = z.object({
  pendingToken: z.string().min(1, 'Pending token is required'),
  code: z
    .string()
    .min(6, 'Enter the 6-digit code from your authenticator app')
    .max(6, 'Enter the 6-digit code from your authenticator app'),
});

const GENERIC_FAILURE = 'Invalid or expired code. Request a new code by signing in again.';

function auditPartnerTwoFactor(action: string, email: string, userId: string) {
  prisma.auditLog
    .create({ data: { action, entityType: 'AUTH', entityId: email, userId } })
    .catch(() => {
      console.warn(`Failed to persist partner 2FA audit entry: ${action} for ${email}`);
    });
}

export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'auth', RATE_LIMIT_POLICIES.auth);
  if (limited) return limited;

  try {
    const body = await request.json();
    const validatedData = twoFactorSchema.parse(body);

    const payload = await verifyPendingTwoFactorToken(validatedData.pendingToken);
    if (!payload || payload.role !== 'PARTNER') {
      return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { partner: true },
    });

    if (!user || user.role !== 'PARTNER') {
      return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
    }

    if (user.partner?.approvalStatus !== 'APPROVED') {
      return NextResponse.json(
        {
          error:
            'Your partner account is pending approval or has been suspended. Please contact support.',
        },
        { status: 403 }
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: 'Too many failed attempts. This account is temporarily locked.' },
        { status: 423 }
      );
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
    }

    const secret = decryptTotpSecret(user.twoFactorSecret);
    if (!secret || !verifyTotpCode(secret, validatedData.code)) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= TWO_FACTOR_LOCKOUT_THRESHOLD;

      await prisma.user.update({
        where: { id: user.id },
        data: shouldLock
          ? {
              failedLoginAttempts: attempts,
              lockedUntil: new Date(Date.now() + TWO_FACTOR_LOCKOUT_MINUTES * 60_000),
            }
          : { failedLoginAttempts: attempts },
      });

      auditPartnerTwoFactor(
        shouldLock ? 'PARTNER_LOGIN_LOCKOUT_TRIGGERED' : 'PARTNER_2FA_FAILED',
        user.email,
        user.id
      );

      return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
    }

    // Success — reset counters
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    auditPartnerTwoFactor('PARTNER_LOGIN_SUCCESS', user.email, user.id);

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: 'PARTNER',
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

    response.cookies.set('auth_token_partner', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Partner 2FA login verification error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
