import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

const moderationSchema = z.object({ approved: z.boolean() });

/**
 * PATCH /api/admin/testimonials/[id] — approve or unpublish a testimonial.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { approved } = moderationSchema.parse(body);

    const updated = await prisma.testimonial.update({
      where: { id },
      data: { approved },
    });

    return NextResponse.json({ testimonial: updated }, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }
    console.error('Moderate testimonial error:', error);
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/testimonials/[id] — remove a submission entirely.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await prisma.testimonial.delete({ where: { id } });

    return NextResponse.json({ message: 'Testimonial deleted' }, { status: 200 });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }
    console.error('Delete testimonial error:', error);
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 });
  }
}
