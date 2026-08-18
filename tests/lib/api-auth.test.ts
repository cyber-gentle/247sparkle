import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { enforceSameOrigin, requireRole } from '../../src/lib/api-auth';
import { signToken } from '../../src/lib/auth';
import { config as middlewareConfig } from '../../src/middleware';

describe('API authorization helpers', () => {
  it('returns forbidden when a verified session lacks the required role', async () => {
    const token = await signToken({
      userId: 'user-1',
      email: 'customer@example.com',
      role: 'CUSTOMER',
    });
    const request = new NextRequest('http://localhost/api/admin/orders', {
      headers: { cookie: `auth_token=${token}` },
    });

    const result = await requireRole(request, ['ADMIN']);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it('blocks a cross-origin state-changing request', () => {
    const request = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      headers: { origin: 'https://attacker.example' },
    });

    expect(enforceSameOrigin(request)?.status).toBe(403);
  });

  it('excludes public image assets from the protected-route matcher', () => {
    const matcher = new RegExp(`^${middlewareConfig.matcher[0]}$`);

    expect('/images/bg-image.jpeg').not.toMatch(matcher);
    expect('/images/home_cleaning__2__.jpeg').not.toMatch(matcher);
    expect('/customer/dashboard').toMatch(matcher);
  });
});
