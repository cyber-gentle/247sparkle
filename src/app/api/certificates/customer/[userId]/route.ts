import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

/**
 * GET /api/certificates/customer/[userId] — customer's certificates.
 *
 * Supports /api/certificates/customer/me, /api/certificates/customer/current,
 * or a specific customer userId when requested by an ADMIN.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireRole(request, ['CUSTOMER', 'ADMIN']);
  if (!auth.ok) {
    // Fallback: Check middleware-injected x-user-id header
    const headerUserId = request.headers.get('x-user-id');
    const headerRole = request.headers.get('x-user-role');
    if (!headerUserId || (headerRole !== 'CUSTOMER' && headerRole !== 'ADMIN')) {
      return auth.response;
    }
  }

  const sessionUserId = auth.ok ? auth.session.userId : request.headers.get('x-user-id')!;
  const sessionRole = auth.ok ? auth.session.role : request.headers.get('x-user-role')!;

  const { userId: routeUserId } = await params;

  try {
    let targetCustomerId: string | null = null;

    if (
      sessionRole === 'ADMIN' &&
      routeUserId &&
      routeUserId !== 'me' &&
      routeUserId !== 'current'
    ) {
      // Admin looking up a specific customer
      const targetCustomer = await prisma.customer.findFirst({
        where: {
          OR: [{ userId: routeUserId }, { id: routeUserId }],
        },
      });
      if (!targetCustomer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      targetCustomerId = targetCustomer.id;
    } else {
      // Customer looking up their own certificates
      const customer = await prisma.customer.findUnique({
        where: { userId: sessionUserId },
      });
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      targetCustomerId = customer.id;
    }

    const certificates = await prisma.certificate.findMany({
      where: { customerId: targetCustomerId },
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
