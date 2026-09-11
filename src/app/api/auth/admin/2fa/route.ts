import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { ADMIN_SESSION_EXPIRY, signToken, verifyPendingTwoFactorToken } from '@/lib/auth';
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

function auditTwoFactor(action: string, email: string, userId: string) {
  prisma.auditLog
    .create({ data: { action, entityType: 'AUTH', entityId: email, userId } })
    .catch(() => {
      console.warn(`Failed to persist admin 2FA audit entry: ${action} for ${email}`);
    });
}

export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'admin-auth', RATE_LIMIT_POLICIES.adminAuth);
  if (limited) return limited;

  try {
    const body = await request.json();
    const validatedData = twoFactorSchema.parse(body);

    const payload = await verifyPendingTwoFactorToken(validatedData.pendingToken);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
    }

    // A wrong 2FA code counts toward the same lockout as a wrong password —
    // otherwise the code endpoint would be an unlimited guessing channel.
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: 'Too many failed attempts. This account is temporarily locked.' },
        { status: 423 }
      );
    }

    // --- Enrollment: the not-yet-confirmed secret lives on the user record. ---
    if (!user.twoFactorEnabled) {
      const secret = user.twoFactorSecret ? decryptTotpSecret(user.twoFactorSecret) : null;
      if (!secret || !verifyTotpCode(secret, validatedData.code)) {
        // Typos are expected during first-time setup and do not count toward
        // the lockout — the pending token and rate limit bound the guessing.
        auditTwoFactor('ADMIN_2FA_ENROLLMENT_FAILED', user.email, user.id);
        return NextResponse.json(
          { error: 'That code did not match. Check your app and retry.' },
          { status: 401 }
        );
      }

      // The authenticator works — confirm the (already stored) secret and
      // finish the login.
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: true,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
      auditTwoFactor('ADMIN_2FA_ENABLED', user.email, user.id);

      return await buildSuccessResponse(user);
    }

    // --- Verification: the confirmed secret lives (encrypted) on the record. ---
    if (!user.twoFactorSecret) {
      // Enabled flag missing but a pending token was issued — refuse rather
      // than fall back to a single-factor login.
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

      auditTwoFactor(
        shouldLock ? 'ADMIN_LOGIN_LOCKOUT_TRIGGERED' : 'ADMIN_2FA_FAILED',
        user.email,
        user.id
      );

      return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    auditTwoFactor('ADMIN_LOGIN_SUCCESS', user.email, user.id);

    return await buildSuccessResponse(user);
  } catch (error: any) {
    console.error('Admin 2FA verification error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

/** Issue the real (short-lived) admin session. */
async function buildSuccessResponse(user: {
  id: string;
  fullName: string;
  email: string;
  role: string;
}) {
  const token = await signToken(
    { userId: user.id, email: user.email, role: 'ADMIN' },
    { expiresIn: ADMIN_SESSION_EXPIRY }
  );

  const response = NextResponse.json(
    {
      message: 'Admin login successful',
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    },
    { status: 200 }
  );

  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 2 * 60 * 60, // matches ADMIN_SESSION_EXPIRY
  });

  return response;
}
