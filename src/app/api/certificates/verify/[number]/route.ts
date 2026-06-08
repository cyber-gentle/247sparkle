import { NextResponse } from 'next/server';

import { findCertificate } from '@/lib/mock-data';

export async function GET(_request: Request, { params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const certificateNumber = decodeURIComponent(number ?? '').trim();

  if (!certificateNumber) {
    return NextResponse.json(
      {
        valid: false,
        message: 'Certificate number is required.',
      },
      { status: 400 }
    );
  }

  const certificate = findCertificate(certificateNumber);

  if (!certificate) {
    return NextResponse.json(
      {
        valid: false,
        message: 'Certificate not found.',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    valid: true,
    certificate,
  });
}
