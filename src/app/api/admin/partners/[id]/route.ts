import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

const approvalSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'SUSPEND']),
});

const ACTION_TO_STATUS: Record<string, string> = {
  APPROVE: 'APPROVED',
  REJECT: 'REJECTED',
  SUSPEND: 'SUSPENDED',
};

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = approvalSchema.parse(body);

    const partner = await prisma.partner.update({
      where: { id },
      data: { approvalStatus: ACTION_TO_STATUS[action] },
      include: {
        user: { select: { fullName: true, email: true } },
      },
    });

    return NextResponse.json(
      { message: `Partner ${action.toLowerCase()}d successfully`, partner },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Approve partner error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 });
  }
}
