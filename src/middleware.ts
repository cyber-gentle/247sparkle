import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

// Routes a user may visit WITHOUT being authenticated (no auth_token cookie).
const publicRoutes = [
  '/',
  '/services',
  '/how-it-works',
  '/become-a-partner',
  '/contact',
  '/verify',
  '/customer/login',
  '/customer/signup',
  '/rider/login',
  '/rider/signup',
  '/partner/login',
  '/partner/signup',
  '/admin/login',
];

// Always allow the logout endpoint — it clears the cookie regardless of token state.
const logoutPath = '/api/auth/logout';

// API paths whose primary action is public. These are allowed through without a
// token, but the middleware STILL verifies any token that is present and sets
// the x-user-* headers — so admin-gated verbs on the same path (e.g. GET
// /api/quotations) can enforce role checks inside the route handler.
const publicApiRoutes = [
  '/api/auth', // login/signup flows must be reachable without a session (rate-limited above)
  '/api/quotations', // POST (contact form) is public; GET is admin-gated in the handler
  '/api/certificates/verify', // public certificate lookup (no login required)
  '/api/pricing', // public price list for the booking flow
  '/api/payment/webhook', // Paystack server-to-server; authenticated via HMAC signature in the handler
];

const isPublicPath = (pathname: string) => {
  if (pathname === logoutPath) return true;

  const checkRoute = (route: string) => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname === route || pathname.startsWith(route + '/');
  };

  return publicRoutes.some(checkRoute) || publicApiRoutes.some(checkRoute);
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('auth_token')?.value;
  const isApiRoute = pathname.startsWith('/api/');

  // Throttle credential endpoints (login/signup) per IP to blunt brute-force
  // and enumeration attacks. Logout is exempt — it's harmless and clearing a
  // session should never be blocked.
  if (request.method === 'POST' && pathname.startsWith('/api/auth/') && pathname !== logoutPath) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed, retryAfterSeconds } = rateLimit(
      `auth:${ip}`,
      10, // 10 attempts
      60_000 // per minute
    );
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
      );
    }
  }

  // API routes expect a JSON 401 (not an HTML redirect) so fetch callers can
  // react to it — e.g. by routing to the portal login page.
  const unauthorized = () =>
    isApiRoute
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : NextResponse.redirect(new URL('/customer/login', request.url));

  // Always try to decode the token so we can attach the user identity to the
  // request headers for downstream handlers — even on public routes (a logged-in
  // admin hitting GET /api/quotations needs the x-user-role header to be set).
  let payload = null;
  if (token) {
    try {
      payload = await verifyToken(token);
    } catch {
      payload = null;
    }
  }

  // A present-but-invalid token means the session is stale. For protected
  // routes that's an auth failure; for public paths (including /api/auth login
  // endpoints) we treat the caller as anonymous — otherwise an expired cookie
  // would lock users out of logging back in.
  if (token && !payload && !isPublicPath(pathname)) {
    return unauthorized();
  }

  if (!payload && !isPublicPath(pathname)) {
    return unauthorized();
  }

  // Attach identity headers for route handlers.
  // We explicitly delete client-provided headers to prevent header injection.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-user-id');
  requestHeaders.delete('x-user-email');
  requestHeaders.delete('x-user-role');

  if (payload) {
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-email', payload.email);
    requestHeaders.set('x-user-role', payload.role);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
