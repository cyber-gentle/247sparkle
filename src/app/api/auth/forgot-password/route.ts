import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { createPasswordResetToken, PASSWORD_RESET_TTL_MINUTES } from '@/lib/password-reset';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// The response is identical whether or not the email is registered, so the
// endpoint cannot be used to probe which addresses have accounts.
const GENERIC_SUCCESS_MESSAGE =
  'If an account exists for that email, a password reset link has been sent.';

function buildResetLink(origin: string, token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || origin;
  return `${baseUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
}

export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'auth', RATE_LIMIT_POLICIES.auth);
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }
    const validatedData = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (user) {
      const { token } = await createPasswordResetToken(user.id);

      const resetLink = buildResetLink(request.nextUrl.origin, token);
      const minutes = String(PASSWORD_RESET_TTL_MINUTES);

      await sendEmail({
        to: user.email,
        subject: 'Reset your 247Sparkle password',
        text: [
          `Hello ${user.fullName},`,
          '',
          'We received a request to reset your 247Sparkle password.',
          `Open the link below within ${minutes} minutes to choose a new one:`,
          resetLink,
          '',
          'If you did not request this, you can safely ignore this email —',
          'your password will not change.',
        ].join('\n'),
        html: `
          <p>Hello ${user.fullName},</p>
          <p>We received a request to reset your 247Sparkle password.</p>
          <p>
            <a href="${resetLink}">Click here to choose a new password</a> —
            this link expires in ${minutes} minutes.
          </p>
          <p>
            If you did not request this, you can safely ignore this email —
            your password will not change.
          </p>
        `,
      });
    }

    return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE }, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
