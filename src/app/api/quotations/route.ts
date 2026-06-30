import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Values are stored lowercase to match the public contact form options and
// the admin quotations UI (which capitalizes them for display). The Quotation
// model columns are free-form strings, so casing is unconstrained at the DB layer.
const ALLOWED_TYPES = ['office_cleaning', 'office_fumigation', 'commercial_fumigation'] as const;
type ServiceType = (typeof ALLOWED_TYPES)[number];

/**
 * GET /api/quotations — admin only.
 * Returns all quotation requests, newest first.
 */
export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role');

  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
 * POST /api/quotations — public (no auth required).
 * Submitted from the public contact/quotation form.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const serviceType = String(body.serviceType ?? '');
    const contactName = String(body.contactName ?? '').trim();
    const address = String(body.address ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const email = String(body.email ?? '').trim();
    const message = String(body.message ?? '').trim();

    if (!ALLOWED_TYPES.includes(serviceType as ServiceType)) {
      return NextResponse.json({ error: 'Invalid serviceType' }, { status: 400 });
    }
    if (!contactName || !address || !phone || !email || !message) {
      return NextResponse.json(
        { error: 'contactName, address, phone, email, and message are required' },
        { status: 400 }
      );
    }

    const quotation = await prisma.quotation.create({
      data: {
        serviceType: serviceType as ServiceType,
        contactName,
        businessName: String(body.businessName ?? '').trim() || null,
        address,
        phone,
        email,
        message,
        status: 'new',
      },
    });

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (error) {
    console.error('Create quotation error:', error);
    return NextResponse.json({ error: 'Failed to submit quotation request' }, { status: 500 });
  }
}
