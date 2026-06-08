import Link from 'next/link';
import PublicFooter from '@/components/PublicFooter';
import PublicNavbar from '@/components/PublicNavbar';

export default function HowItWorksPage() {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-slate-50 pb-20 pt-24">
        <section className="mx-auto w-full max-w-4xl px-6 lg:px-10">
          <div className="public-card public-card-accent">
            <div className="public-card-body">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#CC0000]">
                How It Works
              </p>
              <h1 className="text-3xl font-extrabold text-[#1A0A5E]">
                Full Process Guide Coming Soon
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                We are preparing a complete step-by-step workflow for laundry, home cleaning, and
                fumigation orders. This page currently uses the requested placeholder while the
                final client-approved process content is being finalized.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/customer/signup"
                  className="rounded-xl bg-[#1A0A5E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#120843]"
                >
                  Book a Service
                </Link>
                <Link
                  href="/services"
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  View Services
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
