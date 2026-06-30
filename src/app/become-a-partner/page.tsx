import Link from 'next/link';
import { Bike, CheckCircle2, Store } from 'lucide-react';

import PublicFooter from '@/components/PublicFooter';
import PublicNavbar from '@/components/PublicNavbar';

export default function BecomeAPartnerPage() {
  return (
    <>
      <PublicNavbar />
      <main className="bg-slate-50 pb-20 pt-24">
        <section className="mx-auto w-full max-w-6xl px-6 lg:px-10">
          <div className="mb-8 rounded-3xl bg-[#1A0A5E] p-8 text-white">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F5C200]">
              Partner Program
            </p>
            <h1 className="text-3xl font-extrabold md:text-4xl">
              Join the 247 Sparkle Service Network
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-white/80">
              Whether you run a laundry business or want to earn as a delivery rider, we have a
              growth path for you.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <article className="public-card public-card-hover public-card-accent">
              <div className="public-card-body flex h-full flex-col">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A0A5E] text-white">
                    <Store size={22} />
                  </div>
                  <span className="public-pill">Business</span>
                </div>
                <h2 className="text-2xl font-bold text-[#1A0A5E]">Laundry Business Partner</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Receive routed orders, set your operational hours, and grow predictable monthly
                  revenue through the platform.
                </p>
                <ul className="mt-5 space-y-3 text-sm text-slate-700">
                  {[
                    'Order visibility from partner dashboard',
                    'Workload status for better route allocation',
                    'Revenue and commission tracking',
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-[#F5C200]" size={16} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/partner/signup"
                  className="mt-7 inline-flex w-fit rounded-xl bg-[#1A0A5E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#120843]"
                >
                  Register as Laundry Business
                </Link>
              </div>
            </article>

            <article className="public-card public-card-hover public-card-accent">
              <div className="public-card-body flex h-full flex-col">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#CC0000] text-white">
                    <Bike size={22} />
                  </div>
                  <span className="public-pill">Rider</span>
                </div>
                <h2 className="text-2xl font-bold text-[#1A0A5E]">Rider Partner</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Handle pickup and delivery tasks across Otukpo, track commissions, and request
                  withdrawals from your rider portal.
                </p>
                <ul className="mt-5 space-y-3 text-sm text-slate-700">
                  {[
                    'Job assignment and status updates',
                    'Earnings dashboard with history',
                    'Availability toggle for dispatch routing',
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-[#F5C200]" size={16} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/rider/signup"
                  className="mt-7 inline-flex w-fit rounded-xl bg-[#CC0000] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b70000]"
                >
                  Register as Rider
                </Link>
              </div>
            </article>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
