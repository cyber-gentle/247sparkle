import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/db';
import { signToken, signPendingTwoFactorToken } from '@/lib/auth';
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

function auditAdminLogin(action: string, email: string, userId?: string) {
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
      console.warn(`Failed to persist admin auth audit entry: ${action} for ${email}`);
    });
}

export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'auth', RATE_LIMIT_POLICIES.auth);
  if (limited) return limited;

  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: { partner: true },
    });

    if (!user || (user.role !== 'PARTNER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Role detection: if user is an ADMIN, route through admin 2FA flow
    if (user.role === 'ADMIN') {
      try {
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          auditAdminLogin('ADMIN_LOGIN_LOCKED', user.email, user.id);
          return NextResponse.json(
            {
              error:
                'Too many failed attempts. This account is temporarily locked — try again later.',
            },
            { status: 423 }
          );
        }

        const isValidPassword = await compare(validatedData.password, user.passwordHash);
        if (!isValidPassword) {
          const attempts = (user.failedLoginAttempts || 0) + 1;
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

          auditAdminLogin(
            shouldLock ? 'ADMIN_LOGIN_LOCKOUT_TRIGGERED' : 'ADMIN_LOGIN_FAILED',
            user.email,
            user.id
          );

          return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        if ((user.failedLoginAttempts && user.failedLoginAttempts > 0) || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        if (!user.twoFactorEnabled) {
          let secret = user.twoFactorSecret ? decryptTotpSecret(user.twoFactorSecret) : null;
          if (!secret) {
            secret = generateTotpSecret();
            await prisma.user.update({
              where: { id: user.id },
              data: { twoFactorSecret: encryptTotpSecret(secret) },
            });
          }

          return NextResponse.json(
            {
              role: 'ADMIN',
              requiresEnrollment: true,
              pendingToken: await signPendingTwoFactorToken({
                userId: user.id,
                email: user.email,
                role: 'ADMIN',
              }),
              otpauthUri: totpUri(user.email, secret),
              secret,
            },
            { status: 200 }
          );
        }

        auditAdminLogin('ADMIN_LOGIN_2FA_PENDING', user.email, user.id);

        return NextResponse.json(
          {
            role: 'ADMIN',
            requiresTwoFactor: true,
            pendingToken: await signPendingTwoFactorToken({
              userId: user.id,
              email: user.email,
              role: 'ADMIN',
            }),
          },
          { status: 200 }
        );
      } catch (adminError: any) {
        console.error('Admin routed login error:', adminError);
        return NextResponse.json({ error: adminError?.message || 'Login failed' }, { status: 500 });
      }
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: 'Too many failed attempts. This account is temporarily locked.' },
        { status: 423 }
      );
    }

    // Verify password FIRST — revealing approval status before proving
    // knowledge of the password would let anyone enumerate partner accounts.
    const isValidPassword = await compare(validatedData.password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check partner approval status
    if (user.partner?.approvalStatus !== 'APPROVED') {
      return NextResponse.json(
        {
          error:
            'Your partner account is pending approval or has been suspended. Please contact support.',
        },
        { status: 403 }
      );
    }

    // Password accepted — reset any failed login attempts/lockout
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // Second factor check: if partner has 2FA enabled, require TOTP code
    if (user.twoFactorEnabled) {
      const pendingToken = await signPendingTwoFactorToken({
        userId: user.id,
        email: user.email,
        role: 'PARTNER',
      });

      return NextResponse.json(
        {
          requiresTwoFactor: true,
          pendingToken,
        },
        { status: 200 }
      );
    }

    // Generate JWT token
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
    console.error('Partner login error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: error?.message || 'Login failed' }, { status: 500 });
  }
}
