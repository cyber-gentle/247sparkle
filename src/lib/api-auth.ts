import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSessionFromRequest, type JWTPayload, type UserRole } from '@/lib/auth';

type AuthFailure = { ok: false; response: NextResponse };
type AuthSuccess = { ok: true; session: JWTPayload };
export type SessionResult = AuthFailure | AuthSuccess;

function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function requireSession(request: NextRequest): Promise<SessionResult> {
  const session = await getSessionFromRequest(request);
  return session ? { ok: true, session } : { ok: false, response: unauthorizedResponse() };
}

export async function requireRole(
  request: NextRequest,
  roles: readonly UserRole[]
): Promise<SessionResult> {
  const result = await requireSession(request);
  if (!result.ok) return result;

  if (!roles.includes(result.session.role)) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return result;
}

export function isAllowedOrigin(origin: string, request: NextRequest): boolean {
  if (!origin) return true;
  if (origin === request.nextUrl.origin) return true;

  try {
    const originUrl = new URL(origin);

    // 1. Direct host match (e.g. https://two47sparkle.onrender.com vs http://two47sparkle.onrender.com behind proxy)
    if (originUrl.host.toLowerCase() === request.nextUrl.host.toLowerCase()) {
      return true;
    }

    // 2. Reverse proxy forwarded host match (x-forwarded-host or host header)
    const forwardedHost = request.headers.get('x-forwarded-host');
    if (forwardedHost) {
      const cleanHost = forwardedHost.split(',')[0].trim().toLowerCase();
      if (originUrl.host.toLowerCase() === cleanHost) {
        return true;
      }
    }

    const hostHeader = request.headers.get('host');
    if (hostHeader) {
      const cleanHost = hostHeader.split(',')[0].trim().toLowerCase();
      if (originUrl.host.toLowerCase() === cleanHost) {
        return true;
      }
    }

    // 3. Configured public site URL (e.g. from Render environment variables)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (siteUrl) {
      const siteParsed = new URL(siteUrl);
      if (
        origin.toLowerCase() === siteParsed.origin.toLowerCase() ||
        originUrl.host.toLowerCase() === siteParsed.host.toLowerCase()
      ) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

export function enforceSameOrigin(request: NextRequest): NextResponse | null {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return null;

  const origin = request.headers.get('origin');
  if (!origin || isAllowedOrigin(origin, request)) return null;

  return NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 });
}
