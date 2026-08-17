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

export function enforceSameOrigin(request: NextRequest): NextResponse | null {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return null;

  const origin = request.headers.get('origin');
  if (!origin || origin === request.nextUrl.origin) return null;

  return NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 });
}
