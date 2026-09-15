import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

// Admin testimonial moderation. Listing and moderation live under /api/admin/,
// so middleware already rejects non-admin callers; requireRole re-asserts it
// in the handler like every other admin route.

/**
 * GET /api/admin/testimonials — all submissions, pending first, newest first.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: [{ approved: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ testimonials }, { status: 200 });
  } catch (error) {
    console.error('List all testimonials error:', error);
    return NextResponse.json({ error: 'Failed to load testimonials' }, { status: 500 });
  }
}
