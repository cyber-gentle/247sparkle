import { hash } from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { verifyToken, signToken } from '@/lib/auth';
import { POST as customerLogin } from '@/app/api/auth/customer/login/route';
import { middleware } from '@/middleware';
import { jsonRequest } from './helpers';

describe('database-backed session and middleware behavior', () => {
  it('creates a verifiable HttpOnly customer session only for a valid customer password', async () => {
    const password = 'Correct-password-123';
    const user = await prisma.user.create({
      data: {
        fullName: 'Login Customer',
        email: 'login-customer@example.test',
        passwordHash: await hash(password, 10),
        role: 'CUSTOMER',
      },
    });

    const success = await customerLogin(
      jsonRequest('/api/auth/customer/login', { email: user.email, password })
    );
    expect(success.status).toBe(200);
    const cookie = success.headers.get('set-cookie');
    expect(cookie).toContain('auth_token=');
    expect(cookie).toContain('HttpOnly');
    const token = cookie?.match(/auth_token=([^;]+)/)?.[1];
    expect(token).toBeTruthy();
    await expect(verifyToken(token!)).resolves.toMatchObject({ userId: user.id, role: 'CUSTOMER' });

    const failure = await customerLogin(
      jsonRequest('/api/auth/customer/login', { email: user.email, password: 'incorrect-password' })
    );
    expect(failure.status).toBe(401);
    expect(failure.headers.get('set-cookie')).toBeNull();
  });

  it('enforces middleware role, origin, and spoofed-header protections', async () => {
    const customerToken = await signToken({
      userId: 'actual-customer-id',
      email: 'customer@example.test',
      role: 'CUSTOMER',
    });
    const adminToken = await signToken({
      userId: 'actual-admin-id',
      email: 'admin@example.test',
      role: 'ADMIN',
    });

    const anonymous = await middleware(new NextRequest('http://localhost:4028/api/orders'));
    expect(anonymous.status).toBe(401);

    const wrongRole = await middleware(
      new NextRequest('http://localhost:4028/api/admin/users', {
        headers: { cookie: `auth_token=${customerToken}` },
      })
    );
    expect(wrongRole.status).toBe(403);

    const blockedOrigin = await middleware(
      new NextRequest('http://localhost:4028/api/orders', {
        method: 'POST',
        headers: { cookie: `auth_token=${customerToken}`, origin: 'https://attacker.example' },
      })
    );
    expect(blockedOrigin.status).toBe(403);

    const admin = await middleware(
      new NextRequest('http://localhost:4028/api/admin/users', {
        headers: {
          cookie: `auth_token=${adminToken}`,
          'x-user-id': 'spoofed-id',
          'x-user-email': 'spoofed@example.test',
          'x-user-role': 'CUSTOMER',
        },
      })
    );
    expect(admin.status).toBe(200);
    expect(admin.headers.get('x-middleware-request-x-user-id')).toBe('actual-admin-id');
    expect(admin.headers.get('x-middleware-request-x-user-role')).toBe('ADMIN');
    expect(admin.headers.get('x-middleware-request-x-user-email')).toBe('admin@example.test');
  });
});
