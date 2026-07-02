import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hash, compare } from 'bcryptjs';
import prisma from '@/lib/db';

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { currentPassword, newPassword } = passwordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isValid = await compare(currentPassword, user.passwordHash);
    if (!isValid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hash(newPassword, 10) },
    });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change partner password error:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
