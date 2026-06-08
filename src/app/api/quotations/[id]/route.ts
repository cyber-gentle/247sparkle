import { NextResponse } from 'next/server';

import { updateQuotationStatus } from '@/lib/mock-data';

const ALLOWED_STATUSES = ['new', 'responded', 'converted'] as const;
type QuotationStatus = (typeof ALLOWED_STATUSES)[number];

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => null);
  const status = String(body?.status ?? '') as QuotationStatus;

  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  const { id } = await params;
  const updated = updateQuotationStatus(id, status);

  if (!updated) {
    return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
  }

  return NextResponse.json({ quotation: updated });
}
