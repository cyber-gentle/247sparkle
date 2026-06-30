import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require auth
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

  // Public API routes — callable without a token. Admin-only operations within
  // these routes (e.g. listing/updating quotations) are still protected at the
  // route-handler level via the x-user-role header.
  const publicApiRoutes = [
    '/api/quotations', // POST is public (contact form); GET is admin-gated in the handler
    '/api/certificates/verify', // public certificate lookup (no login required)
    '/api/pricing', // public price list for the booking flow
  ];

  // Check if route is public
  const isPublicRoute =
    publicRoutes.some(route => pathname.startsWith(route)) ||
    publicApiRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, verify token
  const token = request.cookies.get('auth_token')?.value;
  const isApiRoute = pathname.startsWith('/api/');

  // API routes expect a JSON 401 (not an HTML redirect) so fetch callers can
  // react to it — e.g. by routing to the portal login page.
  const unauthorized = () =>
    isApiRoute
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : NextResponse.redirect(new URL('/customer/login', request.url));

  if (!token) {
    return unauthorized();
  }

  try {
    const payload = await verifyToken(token);

    if (!payload) {
      return unauthorized();
    }

    // Add payload to request headers for use in API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-email', payload.email);
    requestHeaders.set('x-user-role', payload.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return unauthorized();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
