import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';

// Values are stored lowercase to match the public contact form options and
// the admin quotations UI (which capitalizes them for display). The Quotation
// model columns are free-form strings, so casing is unconstrained at the DB layer.
const ALLOWED_TYPES = ['office_cleaning', 'office_fumigation', 'commercial_fumigation'] as const;

// Mirrors the public contact-message schema's bounds — same form family,
// same guarantees. Rejects wrong types and oversized payloads instead of
// coercing them.
const quotationSchema = z.object({
  serviceType: z.enum(ALLOWED_TYPES),
  contactName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  businessName: z.string().trim().max(100).optional(),
  address: z.string().trim().min(5, 'Address must be at least 5 characters').max(300),
  phone: z.string().trim().min(7, 'Phone number is required').max(20),
  email: z.string().trim().email('Invalid email address'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000),
});

/**
 * GET /api/quotations — admin only.
 * Returns all quotation requests, newest first.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const quotations = await prisma.quotation.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ quotations });
  } catch (error) {
    console.error('List quotations error:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  }
}

/**
 * POST /api/quotations — public (no auth required), rate-limited.
 * Submitted from the public contact/quotation form.
 */
export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(
    request,
    'quotation-submission',
    RATE_LIMIT_POLICIES.quotationSubmission
  );
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const data = quotationSchema.parse(body);

    const quotation = await prisma.quotation.create({
      data: {
        serviceType: data.serviceType,
        contactName: data.contactName,
        businessName: data.businessName || null,
        address: data.address,
        phone: data.phone,
        email: data.email,
        message: data.message,
        status: 'new',
      },
    });

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Create quotation error:', error);
    return NextResponse.json({ error: 'Failed to submit quotation request' }, { status: 500 });
  }
}
