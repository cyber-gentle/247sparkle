import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hash } from 'bcryptjs';
import { generateTotpSecret, encryptTotpSecret } from '@/lib/two-factor';
import { verifyPendingTwoFactorToken } from '@/lib/auth';
import { TOTP } from 'otpauth';

const db = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn().mockResolvedValue({}),
  },
}));

const rateLimitLib = vi.hoisted(() => ({
  rateLimitRequest: vi.fn().mockResolvedValue(null),
  RATE_LIMIT_POLICIES: {
    auth: {},
    adminAuth: {},
  },
}));

vi.mock('@/lib/db', () => ({ default: db }));
vi.mock('@/lib/api-rate-limit', () => ({
  rateLimitRequest: rateLimitLib.rateLimitRequest,
  RATE_LIMIT_POLICIES: rateLimitLib.RATE_LIMIT_POLICIES,
}));

import { POST as partnerLogin } from '@/app/api/auth/partner/login/route';
import { POST as adminTwoFactorVerify } from '@/app/api/auth/admin/2fa/route';

const jsonRequest = (url: string, method: string, body?: unknown) =>
  new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });

describe('Admin Login Routed via Partner Portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitLib.rateLimitRequest.mockResolvedValue(null);
  });

  describe('Role Detection & Security Safeguards', () => {
    it('rejects unknown emails with 401', async () => {
      db.user.findUnique.mockResolvedValue(null);

      const req = jsonRequest('http://localhost/api/auth/partner/login', 'POST', {
        email: 'nobody@example.com',
        password: 'Password123!',
      });

      const res = await partnerLogin(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Invalid email or password');
    });

    it('rejects users with roles other than PARTNER or ADMIN with 401', async () => {
      db.user.findUnique.mockResolvedValue({
        id: 'cust-1',
        email: 'cust@example.com',
        role: 'CUSTOMER',
      });

      const req = jsonRequest('http://localhost/api/auth/partner/login', 'POST', {
        email: 'cust@example.com',
        password: 'Password123!',
      });

      const res = await partnerLogin(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Invalid email or password');
    });

    it('blocks locked admin accounts with 423', async () => {
      db.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@247sparkle.com',
        role: 'ADMIN',
        lockedUntil: new Date(Date.now() + 10 * 60_000),
      });

      const req = jsonRequest('http://localhost/api/auth/partner/login', 'POST', {
        email: 'admin@247sparkle.com',
        password: 'Password123!',
      });

      const res = await partnerLogin(req);
      expect(res.status).toBe(423);
      const data = await res.json();
      expect(data.error).toContain('temporarily locked');
    });

    it('rejects incorrect admin password and records failed attempts', async () => {
      const passwordHash = await hash('CorrectPassword123!', 10);
      db.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@247sparkle.com',
        role: 'ADMIN',
        passwordHash,
        failedLoginAttempts: 2,
        lockedUntil: null,
      });
      db.user.update.mockResolvedValue({});

      const req = jsonRequest('http://localhost/api/auth/partner/login', 'POST', {
        email: 'admin@247sparkle.com',
        password: 'WrongPassword!',
      });

      const res = await partnerLogin(req);
      expect(res.status).toBe(401);

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: { failedLoginAttempts: 3 },
      });
    });

    it('locks admin account when failed attempts reach threshold', async () => {
      const passwordHash = await hash('CorrectPassword123!', 10);
      db.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@247sparkle.com',
        role: 'ADMIN',
        passwordHash,
        failedLoginAttempts: 4, // Next failure hits 5 (threshold)
        lockedUntil: null,
      });
      db.user.update.mockResolvedValue({});

      const req = jsonRequest('http://localhost/api/auth/partner/login', 'POST', {
        email: 'admin@247sparkle.com',
        password: 'WrongPassword!',
      });

      const res = await partnerLogin(req);
      expect(res.status).toBe(401);

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: expect.objectContaining({
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date),
        }),
      });
    });
  });

  describe('Admin 2FA Routing via Partner Login', () => {
    it('returns role ADMIN and requiresTwoFactor for 2FA-enrolled admin', async () => {
      const passwordHash = await hash('AdminPassword123!', 10);
      db.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@247sparkle.com',
        role: 'ADMIN',
        passwordHash,
        twoFactorEnabled: true,
        twoFactorSecret: encryptTotpSecret(generateTotpSecret()),
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      const req = jsonRequest('http://localhost/api/auth/partner/login', 'POST', {
        email: 'admin@247sparkle.com',
        password: 'AdminPassword123!',
      });

      const res = await partnerLogin(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.role).toBe('ADMIN');
      expect(data.requiresTwoFactor).toBe(true);
      expect(data.pendingToken).toBeDefined();
      expect(res.headers.get('set-cookie')).toBeNull(); // Never issues a cookie on password alone

      // Verify the pending token has role ADMIN
      const payload = await verifyPendingTwoFactorToken(data.pendingToken);
      expect(payload).not.toBeNull();
      expect(payload?.role).toBe('ADMIN');
      expect(payload?.userId).toBe('admin-1');
    });

    it('returns role ADMIN and requiresEnrollment for first-time admin', async () => {
      const passwordHash = await hash('AdminPassword123!', 10);
      db.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@247sparkle.com',
        role: 'ADMIN',
        passwordHash,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
      db.user.update.mockResolvedValue({});

      const req = jsonRequest('http://localhost/api/auth/partner/login', 'POST', {
        email: 'admin@247sparkle.com',
        password: 'AdminPassword123!',
      });

      const res = await partnerLogin(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.role).toBe('ADMIN');
      expect(data.requiresEnrollment).toBe(true);
      expect(data.pendingToken).toBeDefined();
      expect(data.otpauthUri).toContain('otpauth://totp/');
      expect(data.secret).toBeDefined();
      expect(res.headers.get('set-cookie')).toBeNull();

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: expect.objectContaining({
          twoFactorSecret: expect.any(String),
        }),
      });
    });

    it('completes the login flow: pendingToken from partner login completes 2FA via /api/auth/admin/2fa', async () => {
      const secret = generateTotpSecret();
      const passwordHash = await hash('AdminPassword123!', 10);

      // 1. Partner login step
      db.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        fullName: 'Super Admin',
        email: 'admin@247sparkle.com',
        role: 'ADMIN',
        passwordHash,
        twoFactorEnabled: true,
        twoFactorSecret: encryptTotpSecret(secret),
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      const loginReq = jsonRequest('http://localhost/api/auth/partner/login', 'POST', {
        email: 'admin@247sparkle.com',
        password: 'AdminPassword123!',
      });

      const loginRes = await partnerLogin(loginReq);
      const loginData = await loginRes.json();
      expect(loginData.pendingToken).toBeDefined();

      // 2. 2FA verification step
      const totp = new TOTP({
        issuer: '247sparkle',
        label: 'admin@247sparkle.com',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret,
      });
      const validCode = totp.generate();

      db.user.update.mockResolvedValue({});

      const twoFactorReq = jsonRequest('http://localhost/api/auth/admin/2fa', 'POST', {
        pendingToken: loginData.pendingToken,
        code: validCode,
      });

      const twoFactorRes = await adminTwoFactorVerify(twoFactorReq);
      expect(twoFactorRes.status).toBe(200);
      const twoFactorData = await twoFactorRes.json();

      expect(twoFactorData.message).toBe('Admin login successful');
      expect(twoFactorData.user.role).toBe('ADMIN');
      // Verify that the auth_token_admin cookie was set
      const setCookie = twoFactorRes.headers.get('set-cookie');
      expect(setCookie).toContain('auth_token_admin=');
    });
  });
});
