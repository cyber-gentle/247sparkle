import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

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

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * Sign a JWT token
 */
export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecretKey());
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256'],
    });
    return payload as unknown as JWTPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Get token from cookies
 */
export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value || null;
}

/**
 * Set auth token in cookies
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

/**
 * Clear auth token from cookies
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}
