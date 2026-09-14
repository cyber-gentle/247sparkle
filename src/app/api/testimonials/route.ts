import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';

// Public testimonial endpoints. The homepage lists approved testimonials;
// anyone may submit one, but it only appears after admin approval
// (/api/admin/testimonials).

const submissionSchema = z.object({
  name: z.string().trim().min(2).max(80),
  location: z.string().trim().max(100).optional(),
  service: z.enum(['LAUNDRY', 'HOME_CLEANING', 'OFFICE_CLEANING', 'FUMIGATION']),
  rating: z.number().int().min(1).max(5),
  quote: z.string().trim().min(10).max(600),
});

/**
 * GET /api/testimonials — approved testimonials for the homepage, newest first.
 */
export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    return NextResponse.json({ testimonials }, { status: 200 });
  } catch (error) {
    console.error('List testimonials error:', error);
    return NextResponse.json({ error: 'Failed to load testimonials' }, { status: 500 });
  }
}

/**
 * POST /api/testimonials — public submission, pending admin approval.
 */
export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(
    request,
    'testimonial-submission',
    RATE_LIMIT_POLICIES.testimonialSubmission
  );
  if (limited) return limited;

  try {
    const body = await request.json();
    const data = submissionSchema.parse(body);

    await prisma.testimonial.create({
      data: { ...data, location: data.location || null, approved: false },
    });

    // Deliberately generic success response — no moderation state or
    // listing details are echoed back to an anonymous submitter.
    return NextResponse.json(
      { message: 'Thank you! Your testimony has been submitted for review.' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Submit testimonial error:', error);
    return NextResponse.json({ error: 'Failed to submit testimony' }, { status: 500 });
  }
}
