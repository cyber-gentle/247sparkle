import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

const approvalSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'SUSPEND']),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = approvalSchema.parse(body);

    let approvalStatus = 'PENDING';
    
    if (action === 'APPROVE') {
      approvalStatus = 'APPROVED';
    } else if (action === 'REJECT') {
      approvalStatus = 'REJECTED';
    } else if (action === 'SUSPEND') {
      approvalStatus = 'SUSPENDED';
    }

    const partner = await prisma.partner.update({
      where: { id: params.id },
      data: {
        approvalStatus: approvalStatus as any,
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: `Partner ${action.toLowerCase()} successfully`, partner },
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

    return NextResponse.json(
      { error: 'Failed to update partner' },
      { status: 500 }
    );
  }
}
