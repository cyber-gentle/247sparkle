import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/api-auth';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    select: { fullName: true, email: true },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ fullName: user.fullName, email: user.email });
}
