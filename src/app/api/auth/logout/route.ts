import { NextResponse } from 'next/server';

const COOKIE_NAMES = [
  'auth_token',
  'auth_token_customer',
  'auth_token_rider',
  'auth_token_partner',
  'auth_token_admin',
];

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  for (const name of COOKIE_NAMES) {
    response.cookies.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
  }
  return response;
}
