import { NextResponse } from 'next/server';

import { listCertificates } from '@/lib/mock-data';

export async function GET(_request: Request, _context: { params: Promise<{ userId: string }> }) {
  return NextResponse.json({ certificates: listCertificates() });
}
