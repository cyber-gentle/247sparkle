import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

// Lowercase values match what is stored on creation (see /api/quotations POST).
const ALLOWED_STATUSES = ['new', 'responded', 'converted'] as const;

const statusSchema = z.object({ status: z.enum(ALLOWED_STATUSES) });

/**
 * PUT /api/quotations/[id] — admin responds to / converts a quotation.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { status } = statusSchema.parse(body);
    const { id } = await params;

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        status,
        respondedAt: status === 'new' ? null : new Date(),
      },
    });

    return NextResponse.json({ quotation });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
    // Prisma throws P2025 when the record is not found
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    console.error('Update quotation error:', error);
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
  }
}
