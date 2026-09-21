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

  it('allows same-origin requests behind reverse proxy with protocol difference', () => {
    // Browser sends https://two47sparkle.onrender.com, internal container is http://two47sparkle.onrender.com:10000
    const request = new NextRequest(
      'http://two47sparkle.onrender.com:10000/api/auth/partner/login',
      {
        method: 'POST',
        headers: {
          origin: 'https://two47sparkle.onrender.com',
          'x-forwarded-host': 'two47sparkle.onrender.com',
          'x-forwarded-proto': 'https',
        },
      }
    );

    expect(enforceSameOrigin(request)).toBeNull();
  });

  it('allows requests matching NEXT_PUBLIC_SITE_URL', () => {
    const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = 'https://two47sparkle.onrender.com';

    const request = new NextRequest('http://127.0.0.1:10000/api/auth/partner/login', {
      method: 'POST',
      headers: {
        origin: 'https://two47sparkle.onrender.com',
      },
    });

    expect(enforceSameOrigin(request)).toBeNull();

    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('blocks attacker origin even when reverse proxy headers exist', () => {
    const request = new NextRequest(
      'http://two47sparkle.onrender.com:10000/api/auth/partner/login',
      {
        method: 'POST',
        headers: {
          origin: 'https://malicious-site.example',
          'x-forwarded-host': 'two47sparkle.onrender.com',
        },
      }
    );

    expect(enforceSameOrigin(request)?.status).toBe(403);
  });

  it('excludes public image assets from the protected-route matcher', () => {
    const matcher = new RegExp(`^${middlewareConfig.matcher[0]}$`);

    expect('/images/bg-image.jpeg').not.toMatch(matcher);
    expect('/images/home_cleaning__2__.jpeg').not.toMatch(matcher);
    expect('/customer/dashboard').toMatch(matcher);
  });
});
