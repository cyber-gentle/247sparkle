import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { compare } from 'bcryptjs';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  totpUri,
  verifyTotpCode,
} from '@/lib/two-factor';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';

const verifyCodeSchema = z.object({
  code: z
    .string()
    .min(6, 'Enter the 6-digit code from your authenticator app')
    .max(6, 'Enter the 6-digit code from your authenticator app'),
});

const disableSchema = z.object({
  password: z.string().min(1, 'Current password is required to disable two-factor authentication'),
});

function auditPartnerTwoFactor(action: string, email: string, userId: string) {
  prisma.auditLog
    .create({ data: { action, entityType: 'AUTH', entityId: email, userId } })
    .catch(() => {
      console.warn(`Failed to persist partner 2FA audit entry: ${action} for ${email}`);
    });
}

/**
 * POST /api/partner/2fa - Start 2FA enrollment.
 * Generates a fresh TOTP secret, encrypts and stores it on the user record,
 * and returns the base32 secret plus the otpauth URI for QR code generation.
 */
export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'auth', RATE_LIMIT_POLICIES.auth);
  if (limited) return limited;

  const auth = await requireRole(request, ['PARTNER']);
  if (!auth.ok) return auth.response;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const secret = generateTotpSecret();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: encryptTotpSecret(secret),
      },
    });

    const uri = totpUri(user.email, secret);

    return NextResponse.json({
      secret,
      otpauthUri: uri,
    });
  } catch (error) {
    console.error('Partner 2FA setup error:', error);
    return NextResponse.json({ error: 'Failed to initiate 2FA setup' }, { status: 500 });
  }
}

/**
 * PUT /api/partner/2fa - Verify and activate 2FA with a valid TOTP code.
 */
export async function PUT(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'auth', RATE_LIMIT_POLICIES.auth);
  if (limited) return limited;

  const auth = await requireRole(request, ['PARTNER']);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { code } = verifyCodeSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: auth.session.userId },
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Two-factor setup has not been initiated' },
        { status: 400 }
      );
    }

    const secret = decryptTotpSecret(user.twoFactorSecret);
    if (!secret) {
      return NextResponse.json(
        { error: 'Invalid or expired setup session. Please start setup again.' },
        { status: 400 }
      );
    }

    if (!verifyTotpCode(secret, code)) {
      return NextResponse.json(
        { error: 'That code did not match. Please check your authenticator app and retry.' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
      },
    });

    auditPartnerTwoFactor('PARTNER_2FA_ENABLED', user.email, user.id);

    return NextResponse.json({
      message: 'Two-factor authentication enabled successfully',
      twoFactorEnabled: true,
    });
  } catch (error: any) {
    console.error('Partner 2FA verification error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to verify two-factor code' }, { status: 500 });
  }
}

/**
 * DELETE /api/partner/2fa - Disable 2FA after confirming password.
 */
export async function DELETE(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'auth', RATE_LIMIT_POLICIES.auth);
  if (limited) return limited;

  const auth = await requireRole(request, ['PARTNER']);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { password } = disableSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: auth.session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPasswordValid = await compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Incorrect password. Enter your current password to disable 2FA.' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    auditPartnerTwoFactor('PARTNER_2FA_DISABLED', user.email, user.id);

    return NextResponse.json({
      message: 'Two-factor authentication disabled successfully',
      twoFactorEnabled: false,
    });
  } catch (error: any) {
    console.error('Partner 2FA disable error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to disable two-factor authentication' },
      { status: 500 }
    );
  }
}
