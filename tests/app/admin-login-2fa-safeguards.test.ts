import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(__dirname, '..', '..');

const loginRoute = readFileSync(
  resolve(projectRoot, 'src/app/api/auth/admin/login/route.ts'),
  'utf8'
);
const twoFactorRoute = readFileSync(
  resolve(projectRoot, 'src/app/api/auth/admin/2fa/route.ts'),
  'utf8'
);

describe('admin login hardening safeguards', () => {
  it('uses the stricter admin rate-limit bucket, not the general auth one', () => {
    expect(loginRoute).toContain("rateLimitRequest(request, 'admin-auth'");
    expect(loginRoute).toContain('RATE_LIMIT_POLICIES.adminAuth');
    expect(twoFactorRoute).toContain("rateLimitRequest(request, 'admin-auth'");
  });

  it('locks the account after repeated password failures', () => {
    expect(loginRoute).toContain('lockedUntil');
    expect(loginRoute).toContain('TWO_FACTOR_LOCKOUT_THRESHOLD');
  });

  it('never issues a session cookie from the password step alone', () => {
    // The only cookie-setting code in the 2FA flow must live in the 2FA route.
    expect(loginRoute).not.toContain('cookies.set');
    expect(twoFactorRoute).toContain("response.cookies.set('auth_token'");
    // And it must use the short admin expiry.
    expect(twoFactorRoute).toContain('ADMIN_SESSION_EXPIRY');
  });

  it('hands the second factor through a pending token, not a session token', () => {
    expect(loginRoute).toContain('signPendingTwoFactorToken');
    expect(twoFactorRoute).toContain('verifyPendingTwoFactorToken');
  });

  it('counts failed 2FA codes toward the same account lockout', () => {
    expect(twoFactorRoute).toContain('failedLoginAttempts');
    expect(twoFactorRoute).toContain('TWO_FACTOR_LOCKOUT_THRESHOLD');
  });

  it('audit-logs admin auth outcomes in both routes', () => {
    expect(loginRoute).toMatch(/auditLog\s*\.\s*create/);
    expect(twoFactorRoute).toMatch(/auditLog\s*\.\s*create/);
  });

  it('stores the TOTP secret only in encrypted form, and reuses it across logins', () => {
    // Secrets are encrypted before storage...
    expect(loginRoute).toContain('encryptTotpSecret');
    expect(twoFactorRoute).toContain('decryptTotpSecret');
    // ...and the enrollment secret is PERSISTED and reused, so a fresh
    // password login never invalidates the QR the admin already scanned.
    expect(loginRoute).toMatch(/twoFactorSecret\s*\?\s*decryptTotpSecret/);
  });
});
