import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

// jose is Web-Crypto based and runs in both the Edge Runtime (middleware) and
// the Node Runtime (route handlers). jsonwebtoken was used previously but its
// reliance on Node's crypto module caused verifyToken() to fail inside the
// middleware, breaking every protected route even with a valid token.

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '7d';

if (!JWT_SECRET) {
  // Fail hard: a missing secret must never silently fall back to a known value,
  // or anyone could forge tokens (including admin ones).
  throw new Error(
    'JWT_SECRET environment variable is not set. Generate one with `openssl rand -base64 48` and add it to .env.'
  );
}

export type JWTPayload = {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'RIDER' | 'PARTNER' | 'ADMIN';
};

export const USER_ROLES = ['CUSTOMER', 'RIDER', 'PARTNER', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Short-lived token handed to the client between "password accepted" and
 * "correct 2FA code entered". It authorizes exactly one thing: submitting a
 * code to the 2FA endpoint. verifyToken() rejects these, so a pending token
 * can never be used as a session cookie.
 */
export type PendingTwoFactorPayload = JWTPayload & {
  pendingTwoFactor: true;
};

export const PENDING_TWO_FACTOR_EXPIRY = '5m';
/** Admin sessions are far shorter than customer sessions. */
export const ADMIN_SESSION_EXPIRY = '2h';

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * Sign a JWT token
 */
export async function signToken(
  payload: JWTPayload,
  options?: { expiresIn?: string }
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(options?.expiresIn ?? JWT_EXPIRY)
    .sign(getSecretKey());
}

/**
 * Sign the short-lived pending-2FA token (see PendingTwoFactorPayload).
 */
export async function signPendingTwoFactorToken(
  payload: Omit<PendingTwoFactorPayload, 'pendingTwoFactor'>
): Promise<string> {
  return new SignJWT({ ...payload, pendingTwoFactor: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(PENDING_TWO_FACTOR_EXPIRY)
    .sign(getSecretKey());
}

/**
 * Verify a pending-2FA token. Returns null for anything else (including valid
 * session tokens, which do not carry the pendingTwoFactor claim).
 */
export async function verifyPendingTwoFactorToken(
  token: string
): Promise<PendingTwoFactorPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256'],
    });
    if (payload.pendingTwoFactor !== true) return null;
    if (
      typeof payload.userId !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.role !== 'string' ||
      !(USER_ROLES as readonly string[]).includes(payload.role)
    ) {
      return null;
    }
    return payload as unknown as PendingTwoFactorPayload;
  } catch {
    return null;
  }
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256'],
    });
    // A pending-2FA token must never double as a session token.
    if (payload.pendingTwoFactor === true) return null;
    if (
      typeof payload.userId !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.role !== 'string' ||
      !(USER_ROLES as readonly string[]).includes(payload.role)
    ) {
      return null;
    }

    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(request: Pick<NextRequest, 'cookies' | 'headers'>) {
  // Prefer the identity headers injected by middleware (already verified).
  const userId = (request as NextRequest).headers?.get('x-user-id');
  const email = (request as NextRequest).headers?.get('x-user-email');
  const role = (request as NextRequest).headers?.get('x-user-role');
  if (userId && email && role && (USER_ROLES as readonly string[]).includes(role)) {
    return { userId, email, role } as JWTPayload;
  }
  // Fallback: try all role-specific cookies then the legacy cookie.
  for (const r of USER_ROLES) {
    const token = request.cookies.get(cookieNameForRole(r))?.value;
    if (token) return verifyToken(token);
  }
  const token = request.cookies.get('auth_token')?.value;
  return token ? verifyToken(token) : null;
}

/** Cookie name for a given role. */
export function cookieNameForRole(role: UserRole): string {
  return `auth_token_${role.toLowerCase()}`;
}

/**
 * Get token from cookies — reads the role-specific cookie for the given role,
 * falling back to the legacy `auth_token` cookie for backwards compatibility.
 */
export async function getTokenFromCookies(role?: UserRole): Promise<string | null> {
  const cookieStore = await cookies();
  if (role) {
    return (
      cookieStore.get(cookieNameForRole(role))?.value ||
      cookieStore.get('auth_token')?.value ||
      null
    );
  }
  return cookieStore.get('auth_token')?.value || null;
}

/**
 * Set auth token in a role-specific cookie.
 */
export async function setAuthCookie(token: string, role?: UserRole): Promise<void> {
  const cookieStore = await cookies();
  const name = role ? cookieNameForRole(role) : 'auth_token';
  cookieStore.set(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

/**
 * Clear auth token cookie for a given role (or the legacy cookie).
 */
export async function clearAuthCookie(role?: UserRole): Promise<void> {
  const cookieStore = await cookies();
  if (role) {
    cookieStore.delete(cookieNameForRole(role));
  }
  // Always clear the legacy cookie too so old sessions don't linger.
  cookieStore.delete('auth_token');
}
