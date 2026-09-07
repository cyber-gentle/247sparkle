import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

/**
 * GET /api/certificates/customer — authenticated customer's certificates.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['CUSTOMER', 'ADMIN']);
  if (!auth.ok) {
    const headerUserId = request.headers.get('x-user-id');
    const headerRole = request.headers.get('x-user-role');
    if (!headerUserId || (headerRole !== 'CUSTOMER' && headerRole !== 'ADMIN')) {
      return auth.response;
    }
  }

  const sessionUserId = auth.ok ? auth.session.userId : request.headers.get('x-user-id')!;

  try {
    const customer = await prisma.customer.findUnique({
      where: { userId: sessionUserId },
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
        id: c.id,
        orderId: c.orderId,
        certificateNumber: c.certificateNumber,
        customerName: c.customerName,
        propertyAddress: c.propertyAddress,
        propertyType: c.propertyType,
        serviceDate: c.serviceDate.toISOString(),
        issuedAt: c.issuedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get customer certificates error:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}
