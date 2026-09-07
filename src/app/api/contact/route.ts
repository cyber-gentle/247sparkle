import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone number is required').max(20),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

/**
 * POST /api/contact — Public contact message submission
 */
export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(
    request,
    'contact-submission',
    RATE_LIMIT_POLICIES.mutation
  );
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const validated = contactSchema.parse(body);

    const quotation = await prisma.quotation.create({
      data: {
        serviceType: 'general_inquiry',
        contactName: validated.name,
        email: validated.email,
        phone: validated.phone,
        message: validated.message,
        status: 'new',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CONTACT_FORM_SUBMISSION',
        entityType: 'QUOTATION',
        entityId: quotation.id,
        changes: JSON.stringify({
          name: validated.name,
          email: validated.email,
          phone: validated.phone,
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for getting in touch! We'll get back to you within 24 hours.",
        id: quotation.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit message. Please try again later.' },
      { status: 500 }
    );
  }
}
