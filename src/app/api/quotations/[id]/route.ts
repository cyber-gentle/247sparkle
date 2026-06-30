import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Lowercase values match what is stored on creation (see /api/quotations POST).
const ALLOWED_STATUSES = ['new', 'responded', 'converted'] as const;
type QuotationStatus = (typeof ALLOWED_STATUSES)[number];

/**
 * PUT /api/quotations/[id] — admin responds to / converts a quotation.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const role = request.headers.get('x-user-role');

  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const status = String(body?.status ?? '') as QuotationStatus;

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

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
    // Prisma throws P2025 when the record is not found
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    console.error('Update quotation error:', error);
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
  }
}
