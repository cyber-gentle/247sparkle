import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/db';
import { signPendingTwoFactorToken } from '@/lib/auth';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';
import {
  TWO_FACTOR_LOCKOUT_MINUTES,
  TWO_FACTOR_LOCKOUT_THRESHOLD,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  totpUri,
} from '@/lib/two-factor';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const LOCKED_MESSAGE =
  'Too many failed attempts. This account is temporarily locked — try again later.';

/** Fire-and-forget admin auth audit entry; logging must never break login. */
function auditLogin(action: string, email: string, userId?: string) {
  prisma.auditLog
    .create({
      data: {
        action,
        entityType: 'AUTH',
        entityId: email,
        userId: userId ?? null,
      },
    })
    .catch(() => {
      // Audit failures are logged server-side only.
      console.warn(`Failed to persist admin auth audit entry: ${action} for ${email}`);
    });
}

export async function POST(request: NextRequest) {
  // Stricter bucket than the general auth policy — see RATE_LIMIT_POLICIES.
  const limited = await rateLimitRequest(request, 'admin-auth', RATE_LIMIT_POLICIES.adminAuth);
  if (limited) return limited;

  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user || user.role !== 'ADMIN') {
      auditLogin('ADMIN_LOGIN_FAILED', validatedData.email);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Per-account lockout — survives attacker IP rotation, unlike the rate limit.
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      auditLogin('ADMIN_LOGIN_LOCKED', user.email, user.id);
      return NextResponse.json({ error: LOCKED_MESSAGE }, { status: 423 });
    }

    // Verify password
    const isValidPassword = await compare(validatedData.password, user.passwordHash);

    if (!isValidPassword) {
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

      auditLogin(
        shouldLock ? 'ADMIN_LOGIN_LOCKOUT_TRIGGERED' : 'ADMIN_LOGIN_FAILED',
        user.email,
        user.id
      );

      // Same message either way: never reveal *why* it failed beyond the lock.
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Password accepted — the counter is only ever reset on a successful login.
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // Second factor: no admin session cookie is issued until the TOTP code is
    // verified. The pending token only authorizes the 2FA submission itself.
    if (!user.twoFactorEnabled) {
      // First login after 2FA rollout: enroll before granting any session.
      // The enrollment secret is PERSISTED and reused across login attempts so
      // the QR stays stable — otherwise every fresh password login silently
      // invalidated the entry the admin already scanned into their app, and
      // every subsequently "correct" code was rejected.
      let secret = user.twoFactorSecret ? decryptTotpSecret(user.twoFactorSecret) : null;

      // No secret yet, or one left unreadable by a JWT_SECRET rotation (the
      // encryption key is derived from it): generate and store a fresh one.
      if (!secret) {
        secret = generateTotpSecret();
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorSecret: encryptTotpSecret(secret) },
        });
      }

      return NextResponse.json(
        {
          requiresEnrollment: true,
          pendingToken: await signPendingTwoFactorToken({
            userId: user.id,
            email: user.email,
            role: 'ADMIN',
          }),
          // Needed to render the QR code / manual entry key. The secret is only
          // confirmed (twoFactorEnabled) once the admin proves their
          // authenticator works.
          otpauthUri: totpUri(user.email, secret),
          secret,
        },
        { status: 200 }
      );
    }

    auditLogin('ADMIN_LOGIN_2FA_PENDING', user.email, user.id);

    return NextResponse.json(
      {
        requiresTwoFactor: true,
        pendingToken: await signPendingTwoFactorToken({
          userId: user.id,
          email: user.email,
          role: 'ADMIN',
        }),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin login error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
