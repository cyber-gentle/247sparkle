import { describe, expect, it } from 'vitest';
import {
  signPendingTwoFactorToken,
  signToken,
  verifyPendingTwoFactorToken,
  verifyToken,
} from '../../src/lib/auth';

describe('pending two-factor tokens', () => {
  it('signs and verifies a pending token', async () => {
    const token = await signPendingTwoFactorToken({
      userId: 'admin-1',
      email: 'admin@247sparkle.com',
      role: 'ADMIN',
    });

    await expect(verifyPendingTwoFactorToken(token)).resolves.toMatchObject({
      userId: 'admin-1',
      role: 'ADMIN',
      pendingTwoFactor: true,
    });
  });

  it('is rejected by verifyToken — a pending token must never act as a session', async () => {
    const token = await signPendingTwoFactorToken({
      userId: 'admin-1',
      email: 'admin@247sparkle.com',
      role: 'ADMIN',
    });

    await expect(verifyToken(token)).resolves.toBeNull();
  });

  it('is rejected by verifyPendingTwoFactorToken once expired', async () => {
    // 5-minute expiry is set at signing; simulate the past by hand-signing an
    // already-expired equivalent.
    const { SignJWT } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const expired = await new SignJWT({
      userId: 'admin-1',
      email: 'admin@247sparkle.com',
      role: 'ADMIN',
      pendingTwoFactor: true,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 300)
      .sign(secret);

    await expect(verifyPendingTwoFactorToken(expired)).resolves.toBeNull();
  });

  it('rejects a regular session token passed off as a pending token', async () => {
    const sessionToken = await signToken({
      userId: 'admin-1',
      email: 'admin@247sparkle.com',
      role: 'ADMIN',
    });

    await expect(verifyPendingTwoFactorToken(sessionToken)).resolves.toBeNull();
  });
});

describe('per-token expiry override', () => {
  it('honours a shorter admin expiry while verifying normally', async () => {
    const token = await signToken(
      { userId: 'admin-1', email: 'admin@247sparkle.com', role: 'ADMIN' },
      { expiresIn: '2h' }
    );

    const session = await verifyToken(token);
    expect(session).toMatchObject({ userId: 'admin-1', role: 'ADMIN' });

    // 2h from now must still be inside the window.
    const { jwtVerify } = await import('jose');
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    const exp = payload.exp as number;
    const twoHours = 2 * 60 * 60;
    const age = exp - Math.floor(Date.now() / 1000);
    expect(age).toBeLessThanOrEqual(twoHours);
    expect(age).toBeGreaterThan(twoHours - 120); // signed moments ago
  });
});
