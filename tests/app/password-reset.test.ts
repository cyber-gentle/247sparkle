import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

const rateLimitLib = vi.hoisted(() => ({
  rateLimitRequest: vi.fn().mockResolvedValue(null),
  RATE_LIMIT_POLICIES: {
    auth: {},
  },
}));

const passwordResetLib = vi.hoisted(() => ({
  createPasswordResetToken: vi.fn(),
  consumePasswordResetToken: vi.fn(),
  PASSWORD_RESET_TTL_MINUTES: 30,
}));

const emailLib = vi.hoisted(() => ({
  sendEmail: vi.fn().mockResolvedValue({ delivered: true, provider: 'resend' }),
}));

vi.mock('@/lib/db', () => ({ default: db }));
vi.mock('@/lib/api-rate-limit', () => ({
  rateLimitRequest: rateLimitLib.rateLimitRequest,
  RATE_LIMIT_POLICIES: rateLimitLib.RATE_LIMIT_POLICIES,
}));
vi.mock('@/lib/password-reset', () => passwordResetLib);
vi.mock('@/lib/email', () => emailLib);

import { POST as forgotPassword } from '@/app/api/auth/forgot-password/route';
import { POST as resetPassword } from '@/app/api/auth/reset-password/route';

const jsonRequest = (url: string, body: unknown) =>
  new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitLib.rateLimitRequest.mockResolvedValue(null);
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it('rejects invalid or missing JSON body with 400', async () => {
    const response = await forgotPassword(
      jsonRequest('http://localhost/api/auth/forgot-password', 'invalid-json')
    );
    expect(response.status).toBe(400);
  });

  it('rejects a malformed email with 400', async () => {
    const response = await forgotPassword(
      jsonRequest('http://localhost/api/auth/forgot-password', { email: 'not-an-email' })
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Validation failed');
  });

  it('returns the same generic message for an unregistered email', async () => {
    db.user.findUnique.mockResolvedValue(null);

    const response = await forgotPassword(
      jsonRequest('http://localhost/api/auth/forgot-password', { email: 'nobody@example.com' })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe(
      'If an account exists for that email, a password reset link has been sent.'
    );
    expect(passwordResetLib.createPasswordResetToken).not.toHaveBeenCalled();
    expect(emailLib.sendEmail).not.toHaveBeenCalled();
  });

  it('issues a single-use token and emails a reset link for a registered email', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'user-1',
      fullName: 'Ada Obi',
      email: 'ada@example.com',
    });
    passwordResetLib.createPasswordResetToken.mockResolvedValue({
      token: 'raw-token',
      expiresAt: new Date(),
    });

    const response = await forgotPassword(
      jsonRequest('http://localhost/api/auth/forgot-password', { email: 'ada@example.com' })
    );

    expect(response.status).toBe(200);
    expect(passwordResetLib.createPasswordResetToken).toHaveBeenCalledWith('user-1');
    expect(emailLib.sendEmail).toHaveBeenCalledTimes(1);

    const message = emailLib.sendEmail.mock.calls[0][0];
    expect(message.to).toBe('ada@example.com');
    expect(message.text).toContain('http://localhost/reset-password?token=raw-token');
  });

  it('builds the reset link from NEXT_PUBLIC_SITE_URL when configured', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.247sparkle.com/';
    db.user.findUnique.mockResolvedValue({
      id: 'user-1',
      fullName: 'Ada Obi',
      email: 'ada@example.com',
    });
    passwordResetLib.createPasswordResetToken.mockResolvedValue({
      token: 'raw-token',
      expiresAt: new Date(),
    });

    await forgotPassword(
      jsonRequest('http://localhost/api/auth/forgot-password', { email: 'ada@example.com' })
    );

    const message = emailLib.sendEmail.mock.calls[0][0];
    expect(message.text).toContain('https://www.247sparkle.com/reset-password?token=raw-token');
  });

  it('still responds generically when email delivery is unavailable', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'user-1',
      fullName: 'Ada Obi',
      email: 'ada@example.com',
    });
    passwordResetLib.createPasswordResetToken.mockResolvedValue({
      token: 'raw-token',
      expiresAt: new Date(),
    });
    emailLib.sendEmail.mockResolvedValue({ delivered: false, provider: 'none' });

    const response = await forgotPassword(
      jsonRequest('http://localhost/api/auth/forgot-password', { email: 'ada@example.com' })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe(
      'If an account exists for that email, a password reset link has been sent.'
    );
  });

  it('returns 429 when the rate limit trips', async () => {
    const limited = new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
    });
    rateLimitLib.rateLimitRequest.mockResolvedValue(limited);

    const response = await forgotPassword(
      jsonRequest('http://localhost/api/auth/forgot-password', { email: 'ada@example.com' })
    );

    expect(response.status).toBe(429);
  });
});

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitLib.rateLimitRequest.mockResolvedValue(null);
  });

  it('rejects a missing token or weak password with 400', async () => {
    const response = await resetPassword(
      jsonRequest('http://localhost/api/auth/reset-password', {
        token: '',
        newPassword: 'short',
      })
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Validation failed');
  });

  it('rejects an invalid, expired, or already-used token with 400 and a retry hint', async () => {
    for (const reason of ['INVALID', 'EXPIRED', 'USED'] as const) {
      passwordResetLib.consumePasswordResetToken.mockResolvedValue({ ok: false, reason });

      const response = await resetPassword(
        jsonRequest('http://localhost/api/auth/reset-password', {
          token: 'bad-token',
          newPassword: 'newsecret',
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Please request a new one');
      expect(db.user.update).not.toHaveBeenCalled();
    }
  });

  it('consumes the token and updates the password hash on success', async () => {
    passwordResetLib.consumePasswordResetToken.mockResolvedValue({ ok: true, userId: 'user-1' });
    db.user.update.mockResolvedValue({ id: 'user-1' });

    const response = await resetPassword(
      jsonRequest('http://localhost/api/auth/reset-password', {
        token: 'raw-token',
        newPassword: 'newsecret',
      })
    );

    expect(response.status).toBe(200);
    expect(passwordResetLib.consumePasswordResetToken).toHaveBeenCalledWith('raw-token');

    expect(db.user.update).toHaveBeenCalledTimes(1);
    const updateArgs = db.user.update.mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: 'user-1' });
    // bcrypt hash — never the raw password.
    expect(updateArgs.data.passwordHash).not.toBe('newsecret');
    expect(updateArgs.data.passwordHash.startsWith('$2')).toBe(true);
  });

  it('returns 429 when the rate limit trips', async () => {
    const limited = new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
    });
    rateLimitLib.rateLimitRequest.mockResolvedValue(limited);

    const response = await resetPassword(
      jsonRequest('http://localhost/api/auth/reset-password', {
        token: 'raw-token',
        newPassword: 'newsecret',
      })
    );

    expect(response.status).toBe(429);
  });
});
