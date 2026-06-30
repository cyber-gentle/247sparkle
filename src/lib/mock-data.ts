export type CertificateRecord = {
  certificateNumber: string;
  customerName: string;
  propertyAddress: string;
  propertyType: string;
  serviceDate: string;
  serviceType: 'fumigation';
};

export type PricingRecord = {
  id: string;
  serviceType: 'laundry' | 'fumigation';
  itemName: string;
  unitPrice: number;
  updatedAt: string;
};

export type QuotationRecord = {
  id: string;
  serviceType: 'office_cleaning' | 'office_fumigation' | 'commercial_fumigation';
  contactName: string;
  businessName?: string;
  address: string;
  phone: string;
  email: string;
  message: string;
  status: 'new' | 'responded' | 'converted';
  createdAt: string;
};

const certificates: CertificateRecord[] = [
  {
    certificateNumber: 'SPKFUM-2026-00001',
    customerName: 'Adaeze Okonkwo',
    propertyAddress: '12 Ochacho Avenue, Otukpo, Benue State',
    propertyType: '2 Rooms Apartment',
    serviceDate: '2026-04-24',
    serviceType: 'fumigation',
  },
  {
    certificateNumber: 'SPKFUM-2026-00002',
    customerName: 'Ifeanyi Eze',
    propertyAddress: '4 Upu Road, Otukpo, Benue State',
    propertyType: 'Self Contain',
    serviceDate: '2026-05-01',
    serviceType: 'fumigation',
  },
];

const pricing: PricingRecord[] = [
  { id: 'LACE', serviceType: 'laundry', itemName: 'Lace', unitPrice: 5000, updatedAt: now() },
  { id: 'JEANS', serviceType: 'laundry', itemName: 'Jeans', unitPrice: 2500, updatedAt: now() },
  { id: 'AGBADA', serviceType: 'laundry', itemName: 'Agbada', unitPrice: 6500, updatedAt: now() },
  {
    id: 'WHITE_ITEMS',
    serviceType: 'laundry',
    itemName: 'White Items',
    unitPrice: 3000,
    updatedAt: now(),
  },
  {
    id: 'FUM_SINGLE_ROOM',
    serviceType: 'fumigation',
    itemName: 'Single Room',
    unitPrice: 18000,
    updatedAt: now(),
  },
  {
    id: 'FUM_TWO_ROOMS',
    serviceType: 'fumigation',
    itemName: '2 Rooms Apartment',
    unitPrice: 45000,
    updatedAt: now(),
  },
];

const quotations: QuotationRecord[] = [];

function now(): string {
  return new Date().toISOString();
}

export function findCertificate(certificateNumber: string): CertificateRecord | null {
  const normalized = certificateNumber.trim().toUpperCase();
  return certificates.find((item) => item.certificateNumber === normalized) ?? null;
}

export function listCertificates(): CertificateRecord[] {
  return [...certificates].sort((a, b) => b.serviceDate.localeCompare(a.serviceDate));
}

export function listPricing(): PricingRecord[] {
  return [...pricing];
}

export function updatePricing(updates: Array<{ id: string; unitPrice: number }>): {
  updated: PricingRecord[];
  notFoundIds: string[];
} {
  const updated: PricingRecord[] = [];
  const notFoundIds: string[] = [];

  for (const update of updates) {
    const target = pricing.find((item) => item.id === update.id);
    if (!target) {
      notFoundIds.push(update.id);
      continue;
    }
    target.unitPrice = update.unitPrice;
    target.updatedAt = now();
    updated.push({ ...target });
  }

  return { updated, notFoundIds };
}

export function listQuotations(): QuotationRecord[] {
  return [...quotations].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addQuotation(
  input: Omit<QuotationRecord, 'id' | 'status' | 'createdAt'>
): QuotationRecord {
  const created: QuotationRecord = {
    id: `QTN-${Date.now()}`,
    status: 'new',
    createdAt: now(),
    ...input,
  };
  quotations.push(created);
  return created;
}

export function updateQuotationStatus(
  id: string,
  status: QuotationRecord['status']
): QuotationRecord | null {
  const target = quotations.find((item) => item.id === id);
  if (!target) {
    return null;
  }
  target.status = status;
  return { ...target };
}
