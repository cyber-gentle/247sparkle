import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hash } from 'bcryptjs';
import { generateTotpSecret, encryptTotpSecret, totpUri } from '@/lib/two-factor';
import { signPendingTwoFactorToken, signToken } from '@/lib/auth';
import { TOTP, Secret } from 'otpauth';

const db = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  partner: {
    findUnique: vi.fn(),
  },
  auditLog: {
    create: vi.fn().mockResolvedValue({}),
  },
}));

const rateLimitLib = vi.hoisted(() => ({
  rateLimitRequest: vi.fn().mockResolvedValue(null),
  RATE_LIMIT_POLICIES: {
    auth: {},
  },
}));

vi.mock('@/lib/db', () => ({ default: db }));
vi.mock('@/lib/api-rate-limit', () => ({
  rateLimitRequest: rateLimitLib.rateLimitRequest,
  RATE_LIMIT_POLICIES: rateLimitLib.RATE_LIMIT_POLICIES,
}));

import {
  POST as setupPartner2FA,
  PUT as verifyPartner2FA,
  DELETE as disablePartner2FA,
} from '@/app/api/partner/2fa/route';
import { POST as partnerLogin } from '@/app/api/auth/partner/login/route';
import { POST as verifyPartnerLogin2FA } from '@/app/api/auth/partner/2fa/route';

const jsonRequest = (
  url: string,
  method: string,
  body?: unknown,
  headers?: Record<string, string>
) =>
  new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });

describe('Partner Two-Factor Authentication (2FA)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitLib.rateLimitRequest.mockResolvedValue(null);
  });

  describe('POST /api/partner/2fa (Setup Enrollment)', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const req = jsonRequest('http://localhost/api/partner/2fa', 'POST');
      const res = await setupPartner2FA(req);
      expect(res.status).toBe(401);
    });

    it('generates secret and otpauthUri for authenticated partner', async () => {
      const partnerToken = await signToken({
        userId: 'partner-123',
        email: 'partner@example.com',
        role: 'PARTNER',
      });

      db.user.findUnique.mockResolvedValue({
        id: 'partner-123',
        email: 'partner@example.com',
        role: 'PARTNER',
      });
      db.user.update.mockResolvedValue({});

      const req = jsonRequest('http://localhost/api/partner/2fa', 'POST', undefined, {
        cookie: `auth_token_partner=${partnerToken}`,
      });

      const res = await setupPartner2FA(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.secret).toBeDefined();
      expect(data.otpauthUri).toContain('otpauth://totp/247sparkle:partner%40example.com');
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'partner-123' },
        data: expect.objectContaining({
          twoFactorSecret: expect.any(String),
        }),
      });
    });
  });

  describe('PUT /api/partner/2fa (Verify & Activate 2FA)', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const req = jsonRequest('http://localhost/api/partner/2fa', 'PUT', { code: '123456' });
      const res = await verifyPartner2FA(req);
      expect(res.status).toBe(401);
    });

    it('rejects when 2FA setup was not initiated', async () => {
      const partnerToken = await signToken({
        userId: 'partner-123',
        email: 'partner@example.com',
        role: 'PARTNER',
      });

      db.user.findUnique.mockResolvedValue({
        id: 'partner-123',
        email: 'partner@example.com',
        role: 'PARTNER',
        twoFactorSecret: null,
      });

      const req = jsonRequest(
        'http://localhost/api/partner/2fa',
        'PUT',
        { code: '123456' },
        {
          cookie: `auth_token_partner=${partnerToken}`,
        }
      );

      const res = await verifyPartner2FA(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Two-factor setup has not been initiated');
    });

    it('rejects an invalid TOTP code with 400', async () => {
      const partnerToken = await signToken({
        userId: 'partner-123',
        email: 'partner@example.com',
        role: 'PARTNER',
      });

      const secret = generateTotpSecret();
      db.user.findUnique.mockResolvedValue({
        id: 'partner-123',
        email: 'partner@example.com',
        role: 'PARTNER',
        twoFactorSecret: encryptTotpSecret(secret),
      });

      const req = jsonRequest(
        'http://localhost/api/partner/2fa',
        'PUT',
        { code: '000000' },
        {
          cookie: `auth_token_partner=${partnerToken}`,
        }
      );

      const res = await verifyPartner2FA(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('code did not match');
    });

    it('activates 2FA when valid TOTP code is provided', async () => {
      const partnerToken = await signToken({
        userId: 'partner-123',
        email: 'partner@example.com',
        role: 'PARTNER',
      });

      const secret = generateTotpSecret();
      const validCode = new TOTP({
        issuer: '247sparkle',
        label: 'partner@example.com',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: Secret.fromBase32(secret),
      }).generate();

      db.user.findUnique.mockResolvedValue({
        id: 'partner-123',
        email: 'partner@example.com',
        role: 'PARTNER',
        twoFactorSecret: encryptTotpSecret(secret),
      });
      db.user.update.mockResolvedValue({});

      const req = jsonRequest(
        'http://localhost/api/partner/2fa',
        'PUT',
        { code: validCode },
        {
          cookie: `auth_token_partner=${partnerToken}`,
        }
      );

      const res = await verifyPartner2FA(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.twoFactorEnabled).toBe(true);

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'partner-123' },
        data: { twoFactorEnabled: true },
      });
    });
  });

  describe('DELETE /api/partner/2fa (Disable 2FA)', () => {
    it('rejects incorrect password with 400', async () => {
      const partnerToken = await signToken({
        userId: 'partner-123',
        email: 'partner@example.com',
        role: 'PARTNER',
      });

      const passwordHash = await hash('correctPassword123', 10);
      db.user.findUnique.mockResolvedValue({
        id: 'partner-123',
        email: 'partner@example.com',
        role: 'PARTNER',
        passwordHash,
      });

      const req = jsonRequest(
        'http://localhost/api/partner/2fa',
        'DELETE',
        { password: 'wrongPassword' },
        {
          cookie: `auth_token_partner=${partnerToken}`,
        }
      );

      const res = await disablePartner2FA(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Incorrect password');
      expect(db.user.update).not.toHaveBeenCalled();
    });

    it('disables 2FA and clears secret on correct password', async () => {
      const partnerToken = await signToken({
        userId: 'partner-123',
        email: 'partner@example.com',
        role: 'PARTNER',
      });

      const passwordHash = await hash('correctPassword123', 10);
      db.user.findUnique.mockResolvedValue({
        id: 'partner-123',
        email: 'partner@example.com',
        role: 'PARTNER',
        passwordHash,
      });
      db.user.update.mockResolvedValue({});

      const req = jsonRequest(
        'http://localhost/api/partner/2fa',
        'DELETE',
        { password: 'correctPassword123' },
        {
          cookie: `auth_token_partner=${partnerToken}`,
        }
      );

      const res = await disablePartner2FA(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.twoFactorEnabled).toBe(false);

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'partner-123' },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });
    });
  });

  describe('Partner Login with 2FA Challenge', () => {
    it('returns requiresTwoFactor and pendingToken when 2FA is enabled', async () => {
      const passwordHash = await hash('PartnerPass123!', 10);
      db.user.findUnique.mockResolvedValue({
        id: 'partner-123',
        email: 'partner@example.com',
        role: 'PARTNER',
        passwordHash,
        twoFactorEnabled: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        partner: { approvalStatus: 'APPROVED' },
      });

      const req = jsonRequest('http://localhost/api/auth/partner/login', 'POST', {
        email: 'partner@example.com',
        password: 'PartnerPass123!',
      });

      const res = await partnerLogin(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.requiresTwoFactor).toBe(true);
      expect(data.pendingToken).toBeDefined();
      expect(res.headers.get('set-cookie')).toBeNull(); // No session cookie issued yet
    });

    it('completes login and issues cookie via /api/auth/partner/2fa with valid code', async () => {
      const secret = generateTotpSecret();
      const validCode = new TOTP({
        issuer: '247sparkle',
        label: 'partner@example.com',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: Secret.fromBase32(secret),
      }).generate();

      const pendingToken = await signPendingTwoFactorToken({
        userId: 'partner-123',
        email: 'partner@example.com',
        role: 'PARTNER',
      });

      db.user.findUnique.mockResolvedValue({
        id: 'partner-123',
        fullName: 'Sparkle Laundromat',
        email: 'partner@example.com',
        role: 'PARTNER',
        twoFactorSecret: encryptTotpSecret(secret),
        twoFactorEnabled: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        partner: { approvalStatus: 'APPROVED' },
      });
      db.user.update.mockResolvedValue({});

      const req = jsonRequest('http://localhost/api/auth/partner/2fa', 'POST', {
        pendingToken,
        code: validCode,
      });

      const res = await verifyPartnerLogin2FA(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.message).toBe('Login successful');
      expect(data.user.email).toBe('partner@example.com');
      expect(res.headers.get('set-cookie')).toContain('auth_token_partner');
    });

    it('rejects invalid code in /api/auth/partner/2fa', async () => {
      const secret = generateTotpSecret();
      const pendingToken = await signPendingTwoFactorToken({
        userId: 'partner-123',
        email: 'partner@example.com',
        role: 'PARTNER',
      });

      db.user.findUnique.mockResolvedValue({
        id: 'partner-123',
        fullName: 'Sparkle Laundromat',
        email: 'partner@example.com',
        role: 'PARTNER',
        twoFactorSecret: encryptTotpSecret(secret),
        twoFactorEnabled: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        partner: { approvalStatus: 'APPROVED' },
      });
      db.user.update.mockResolvedValue({});

      const req = jsonRequest('http://localhost/api/auth/partner/2fa', 'POST', {
        pendingToken,
        code: '000000',
      });

      const res = await verifyPartnerLogin2FA(req);
      expect(res.status).toBe(401);
      expect(res.headers.get('set-cookie')).toBeNull();
    });
  });
});
