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

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, verify token
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/customer/login', request.url));
  }

  try {
    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.redirect(new URL('/customer/login', request.url));
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
    return NextResponse.redirect(new URL('/customer/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
