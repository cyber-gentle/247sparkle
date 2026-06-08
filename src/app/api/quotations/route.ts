import { NextResponse } from 'next/server';

import { addQuotation, listQuotations } from '@/lib/mock-data';

const ALLOWED_TYPES = ['office_cleaning', 'office_fumigation', 'commercial_fumigation'] as const;
type ServiceType = (typeof ALLOWED_TYPES)[number];

export async function GET() {
  return NextResponse.json({ quotations: listQuotations() });
}

export async function POST(request: Request) {
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

  const quotation = addQuotation({
    serviceType: serviceType as ServiceType,
    contactName,
    businessName: String(body.businessName ?? '').trim() || undefined,
    address,
    phone,
    email,
    message,
  });

  return NextResponse.json({ quotation }, { status: 201 });
}
