'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Building2, Home, Shirt, ShieldCheck } from 'lucide-react';

import PublicFooter from '@/components/PublicFooter';
import PublicNavbar from '@/components/PublicNavbar';
import AppImage from '@/components/ui/AppImage';

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
    label: 'Laundry care',
    details: 'Arrange wash, fold, ironing, and garment-care requests from one service desk.',
    image: '/images/bg-image.jpeg',
    imageAlt: '247Sparkle laundry room with washing machine, garments, and ironing board',
    icon: Shirt,
  },
  {
    title: 'Home Cleaning',
    label: 'Residential care',
    details: 'Plan regular home upkeep or a focused deep-cleaning appointment for your space.',
    image: '/images/home_cleaning__2__.jpeg',
    imageAlt: 'Professional cleaning activity inside a home',
    icon: Home,
  },
  {
    title: 'Office Cleaning',
    label: 'Business spaces',
    details: 'Request a cleaning plan that works around your office and operating schedule.',
    image: '/images/Office_cleaning.jpeg',
    imageAlt: 'Modern office prepared for professional cleaning',
    icon: Building2,
  },
  {
    title: 'Fumigation',
    label: 'Pest control',
    details:
      'Start a residential or commercial fumigation request and discuss the scope with our team.',
    image: '/images/fumigation-service.jpg',
    imageAlt: 'Professional technician using a handheld sprayer for pest-control service',
    icon: ShieldCheck,
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
          <div className="relative mb-10 overflow-hidden rounded-3xl bg-[#1A0A5E] p-8 text-white sm:p-10">
            <div aria-hidden="true" className="absolute inset-y-0 right-0 w-2/5 opacity-30">
              <AppImage
                src="/images/bg-image.jpeg"
                alt=""
                fill
                className="object-cover object-right"
                sizes="(max-width: 768px) 0px, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#1A0A5E]" />
            </div>
            <div className="relative max-w-3xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F5C200]">
                Services
              </p>
              <h1 className="text-3xl font-extrabold md:text-4xl">
                Pick the service that fits your space
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-white/80">
                Start with an image, learn what each service covers, then send your request from a
                single 247Sparkle account.
              </p>
            </div>
          </div>

          <div className="mb-12 grid gap-5 md:grid-cols-2">
            {SERVICE_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="group relative isolate min-h-[360px] overflow-hidden rounded-3xl bg-[#1A0A5E] shadow-[0_24px_65px_rgba(15,23,42,0.16)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <AppImage
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#10073D] via-[#1A0A5E]/65 to-[#1A0A5E]/10" />
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#F5C200] via-[#CC0000] to-[#1A0A5E]" />
                  <div className="relative flex min-h-[360px] flex-col justify-between p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#1A0A5E]/55 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.13em] text-white backdrop-blur-sm">
                        <Icon size={15} className="text-[#F5C200]" />
                        {item.label}
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F5C200] text-[#1A0A5E] shadow-[0_12px_30px_rgba(245,194,0,0.26)]">
                        <Icon size={19} />
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-white">{item.title}</h2>
                      <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
                        {item.details}
                      </p>
                      <Link
                        href="/customer/signup"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#1A0A5E] transition hover:bg-[#F5C200] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1A0A5E]"
                      >
                        Start a request
                        <ArrowUpRight size={16} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
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
