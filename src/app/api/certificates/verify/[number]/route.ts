import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * GET /api/certificates/verify/[number] — PUBLIC, no login required.
 * Looks up a fumigation certificate by its certificate number.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;
  const certificateNumber = decodeURIComponent(number ?? '').trim().toUpperCase();

  if (!certificateNumber) {
    return NextResponse.json(
      {
        valid: false,
        message: 'Certificate number is required.',
      },
      { status: 400 }
    );
  }

  try {
    const certificate = await prisma.certificate.findUnique({
      where: { certificateNumber },
    });

    if (!certificate) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Certificate not found.',
        },
        { status: 404 }
      );
    }

    // Match the shape consumed by /verify page. serviceDate is an ISO string
    // so the frontend formatter parses it consistently.
    return NextResponse.json({
      valid: true,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        customerName: certificate.customerName,
        propertyAddress: certificate.propertyAddress,
        propertyType: certificate.propertyType,
        serviceDate: certificate.serviceDate.toISOString(),
        serviceType: 'fumigation',
      },
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    return NextResponse.json(
      {
        valid: false,
        message: 'Unable to verify certificate at the moment.',
      },
      { status: 500 }
    );
  }
}
