import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';

const issueCertificateSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  propertyAddress: z.string().optional(),
  propertyType: z.string().optional(),
  serviceDate: z.string().optional(),
});

/**
 * POST /api/certificates — Issue fumigation certificate (Admin only)
 */
export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'admin-mutation', RATE_LIMIT_POLICIES.mutation);
  if (limited) return limited;

  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const validatedData = issueCertificateSchema.parse(body);

    const order = await prisma.order.findUnique({
      where: { id: validatedData.orderId },
      include: {
        customer: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        items: true,
        certificate: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.serviceType !== 'FUMIGATION') {
      return NextResponse.json(
        { error: 'Certificates can only be issued for fumigation orders' },
        { status: 400 }
      );
    }

    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Certificates can only be issued for completed orders' },
        { status: 400 }
      );
    }

    if (order.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { error: 'Certificates can only be issued for paid orders' },
        { status: 400 }
      );
    }

    if (order.certificate) {
      return NextResponse.json(
        {
          error: 'Certificate has already been issued for this order',
          certificateNumber: order.certificate.certificateNumber,
        },
        { status: 409 }
      );
    }

    // Generate certificate number: SPKFUM-YYYY-XXXXX
    const currentYear = new Date().getFullYear();
    const prefix = `SPKFUM-${currentYear}-`;
    const latestCert = await prisma.certificate.findFirst({
      where: { certificateNumber: { startsWith: prefix } },
      orderBy: { certificateNumber: 'desc' },
    });

    let nextSeq = 1;
    if (latestCert) {
      const parts = latestCert.certificateNumber.split('-');
      const num = parseInt(parts[2], 10);
      if (!Number.isNaN(num)) {
        nextSeq = num + 1;
      }
    }
    const certificateNumber = `${prefix}${String(nextSeq).padStart(5, '0')}`;

    const customerName = order.customer.user.fullName;
    const propertyAddress = (
      validatedData.propertyAddress ||
      order.deliveryAddress ||
      order.pickupAddress ||
      'Address not specified'
    ).trim();

    const propertyType = (
      validatedData.propertyType ||
      order.items?.[0]?.itemName ||
      'Residential Property'
    ).trim();

    const serviceDate = validatedData.serviceDate
      ? new Date(validatedData.serviceDate)
      : order.scheduledDate || order.createdAt;

    const certificate = await prisma.certificate.create({
      data: {
        orderId: order.id,
        customerId: order.customerId,
        certificateNumber,
        customerName,
        propertyAddress,
        propertyType,
        serviceDate,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'ISSUE_CERTIFICATE',
        entityType: 'CERTIFICATE',
        entityId: certificate.id,
        userId: auth.session.userId,
        changes: JSON.stringify({
          certificateNumber,
          orderId: order.id,
          customerName,
          propertyAddress,
          propertyType,
        }),
      },
    });

    return NextResponse.json(
      {
        message: 'Certificate issued successfully',
        certificate: {
          id: certificate.id,
          certificateNumber: certificate.certificateNumber,
          customerName: certificate.customerName,
          propertyAddress: certificate.propertyAddress,
          propertyType: certificate.propertyType,
          serviceDate: certificate.serviceDate.toISOString(),
          issuedAt: certificate.issuedAt.toISOString(),
          orderId: certificate.orderId,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Issue certificate error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 });
  }
}

/**
 * GET /api/certificates — List all certificates (Admin only)
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const certificates = await prisma.certificate.findMany({
      include: {
        customer: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            deliveryAddress: true,
            pickupAddress: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return NextResponse.json({
      certificates: certificates.map((c) => ({
        id: c.id,
        certificateNumber: c.certificateNumber,
        customerName: c.customerName,
        propertyAddress: c.propertyAddress,
        propertyType: c.propertyType,
        serviceDate: c.serviceDate.toISOString(),
        issuedAt: c.issuedAt.toISOString(),
        orderId: c.orderId,
        customerEmail: c.customer.user.email,
        customerPhone: c.customer.user.phone,
      })),
    });
  } catch (error) {
    console.error('Get all certificates error:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}
