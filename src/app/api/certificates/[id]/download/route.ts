import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateCertificatePDF } from '@/lib/certificate-pdf';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';

export const runtime = 'nodejs';

/**
 * GET /api/certificates/[id]/download — Stream official PDF fumigation certificate
 * Matches by certificate ID or certificateNumber (e.g. SPKFUM-2026-00001).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimitRequest(
    request,
    'certificate-download',
    RATE_LIMIT_POLICIES.certificateLookup
  );
  if (limited) return limited;

  const { id } = await params;
  const identifier = decodeURIComponent(id ?? '').trim();

  if (!identifier) {
    return NextResponse.json({ error: 'Certificate identifier is required' }, { status: 400 });
  }

  try {
    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [
          { id: identifier },
          { certificateNumber: identifier.toUpperCase() },
        ],
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    const pdfBuffer = await generateCertificatePDF({
      certificateNumber: certificate.certificateNumber,
      customerName: certificate.customerName,
      propertyAddress: certificate.propertyAddress,
      propertyType: certificate.propertyType,
      serviceDate: certificate.serviceDate,
      issuedAt: certificate.issuedAt,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="247Sparkle-Certificate-${certificate.certificateNumber}.pdf"`,
        'Cache-Control': 'public, max-age=3600, immutable',
      },
    });
  } catch (error) {
    console.error('Download certificate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate PDF' },
      { status: 500 }
    );
  }
}
