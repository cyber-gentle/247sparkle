import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * GET /api/certificates/customer/[userId] — authenticated customer's certificates.
 *
 * The [userId] segment is retained for URL compatibility, but the actual lookup
 * is driven by the authenticated `x-user-id` header (set by the auth middleware)
 * so a logged-in customer can only ever see their own certificates.
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const certificates = await prisma.certificate.findMany({
      where: { customerId: customer.id },
      orderBy: { serviceDate: 'desc' },
    });

    return NextResponse.json({
      certificates: certificates.map((c) => ({
        certificateNumber: c.certificateNumber,
        customerName: c.customerName,
        propertyAddress: c.propertyAddress,
        propertyType: c.propertyType,
        serviceDate: c.serviceDate.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get customer certificates error:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}
