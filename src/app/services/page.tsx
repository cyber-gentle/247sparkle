'use client';

import { useEffect, useMemo, useState } from 'react';

import PublicFooter from '@/components/PublicFooter';
import PublicNavbar from '@/components/PublicNavbar';

type PricingItem = {
  id: string;
  serviceType: 'laundry' | 'fumigation';
  itemName: string;
  unitPrice: number;
  updatedAt: string;
};

const SERVICE_ITEMS = [
  {
    title: 'Laundry',
    label: 'Pickup + Delivery',
    details:
      'Wash, fold, ironing, white-item separation, and same-day options for selected Otukpo zones.',
  },
  {
    title: 'Home Cleaning',
    label: 'On-site',
    details: 'Residential cleaning teams for regular upkeep and deep cleaning appointments.',
  },
  {
    title: 'Office Cleaning',
    label: 'Quotation',
    details: 'Custom office cleaning schedules with quotation-based pricing for business spaces.',
  },
  {
    title: 'Fumigation',
    label: 'Certified',
    details:
      'On-site residential and commercial fumigation with optional certificate issuance after completion.',
  },
];

const IRONING_NOTE =
  'To avoid friction that wear out fabrics we use dedicated fabric prosteam machine instead of conventional pressing iron. So fast, so clean.';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ServicesPage() {
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPricing() {
      try {
        const response = await fetch('/api/pricing');
        const data = (await response.json()) as { pricing?: PricingItem[] };
        setPricing(data.pricing ?? []);
      } finally {
        setLoading(false);
      }
    }

    loadPricing();
  }, []);

  const laundryPricing = useMemo(
    () => pricing.filter((item) => item.serviceType === 'laundry'),
    [pricing]
  );
  const fumigationPricing = useMemo(
    () => pricing.filter((item) => item.serviceType === 'fumigation'),
    [pricing]
  );

  return (
    <>
      <PublicNavbar />
      <main className="bg-slate-50 pb-20 pt-24">
        <section className="mx-auto w-full max-w-6xl px-6 lg:px-10">
          <div className="mb-10 rounded-3xl bg-[#1A0A5E] p-8 text-white">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F5C200]">
              Services
            </p>
            <h1 className="text-3xl font-extrabold md:text-4xl">
              Professional Cleaning Solutions for Homes and Businesses
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-white/80">
              Explore all 247 Sparkle services and current base pricing from the admin pricing
              engine.
            </p>
          </div>

          <div className="mb-10 grid gap-4 md:grid-cols-2">
            {SERVICE_ITEMS.map((item) => (
              <article
                key={item.title}
                className="public-card public-card-hover public-card-accent"
              >
                <div className="public-card-body">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <h2 className="text-xl font-bold text-[#1A0A5E]">{item.title}</h2>
                    <span className="public-pill shrink-0">{item.label}</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{item.details}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="public-card public-card-accent">
              <div className="public-card-body">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#CC0000]">
                      Admin pricing
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-[#1A0A5E]">Laundry Pricing</h2>
                  </div>
                  <span className="public-pill">Live rates</span>
                </div>
                <div className="mb-5 overflow-hidden rounded-xl border border-slate-200">
                  <video
                    className="aspect-video w-full bg-black/5 object-cover"
                    controls
                    preload="metadata"
                  >
                    <source src="/iron/iron.mp4" type="video/mp4" />
                  </video>
                  <p className="px-4 py-3 text-sm text-slate-700">{IRONING_NOTE}</p>
                </div>
                {loading ? <p className="text-sm text-slate-600">Loading pricing...</p> : null}
                {!loading && laundryPricing.length === 0 ? (
                  <p className="text-sm text-slate-600">No laundry pricing records found.</p>
                ) : null}
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {laundryPricing.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-4 py-3 text-sm last:border-b-0"
                    >
                      <span className="font-medium text-slate-700">{row.itemName}</span>
                      <span className="font-bold text-[#CC0000]">
                        {formatCurrency(row.unitPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="public-card public-card-accent">
              <div className="public-card-body">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#CC0000]">
                      Residential
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-[#1A0A5E]">Fumigation Pricing</h2>
                  </div>
                  <span className="public-pill">On-site</span>
                </div>
                {loading ? <p className="text-sm text-slate-600">Loading pricing...</p> : null}
                {!loading && fumigationPricing.length === 0 ? (
                  <p className="text-sm text-slate-600">No fumigation pricing records found.</p>
                ) : null}
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {fumigationPricing.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-4 py-3 text-sm last:border-b-0"
                    >
                      <span className="font-medium text-slate-700">{row.itemName}</span>
                      <span className="font-bold text-[#CC0000]">
                        {formatCurrency(row.unitPrice)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  Office and commercial service requests are processed through quotation flow.
                </p>
              </div>
            </section>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
