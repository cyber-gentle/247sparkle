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

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = passwordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isValid = await compare(validatedData.currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const newPasswordHash = await hash(validatedData.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
