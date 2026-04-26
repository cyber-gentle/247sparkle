import PublicFooter from '@/components/PublicFooter';
import PublicNavbar from '@/components/PublicNavbar';

const SERVICE_ITEMS = [
  {
    title: 'Laundry',
    details:
      'Wash, fold, ironing, white-item separation, and same-day options for selected Lagos zones.',
  },
  {
    title: 'Home Cleaning',
    details:
      'Residential cleaning teams for regular upkeep and deep cleaning appointments.',
  },
  {
    title: 'Office Cleaning',
    details:
      'Custom office cleaning schedules with quotation-based pricing for business spaces.',
  },
  {
    title: 'Fumigation',
    details:
      'On-site residential and commercial fumigation with optional certificate issuance after completion.',
  },
];

const LAUNDRY_PRICING = [
  { item: 'T-shirt', price: 'N1,500' },
  { item: 'Jeans', price: 'N2,500' },
  { item: 'Agbada', price: 'N6,500' },
  { item: 'Bedsheet', price: 'N3,000' },
  { item: 'Curtains', price: 'N4,000' },
];

const FUMIGATION_PRICING = [
  { property: 'Single Room', price: 'N18,000' },
  { property: 'Self Contain', price: 'N25,000' },
  { property: '1 Room Apartment', price: 'N35,000' },
  { property: '2 Rooms Apartment', price: 'N45,000' },
  { property: '3 Rooms Apartment', price: 'N55,000' },
];

export default function ServicesPage() {
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
              Explore all 247 Sparkle services and transparent pricing samples. Final prices
              can vary by quantity, location, and operational demand.
            </p>
          </div>

          <div className="mb-10 grid gap-4 md:grid-cols-2">
            {SERVICE_ITEMS.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="mb-2 text-xl font-bold text-[#1A0A5E]">{item.title}</h2>
                <p className="text-sm text-slate-600">{item.details}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-[#1A0A5E]">Laundry Pricing Samples</h2>
              <div className="space-y-3">
                {LAUNDRY_PRICING.map((row) => (
                  <div
                    key={row.item}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-slate-700">{row.item}</span>
                    <span className="font-bold text-[#CC0000]">{row.price}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-[#1A0A5E]">Fumigation Pricing Samples</h2>
              <div className="space-y-3">
                {FUMIGATION_PRICING.map((row) => (
                  <div
                    key={row.property}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-slate-700">{row.property}</span>
                    <span className="font-bold text-[#CC0000]">{row.price}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Office and commercial service requests are processed through quotation flow.
              </p>
            </section>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
