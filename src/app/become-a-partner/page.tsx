import Link from 'next/link';
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
            <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-bold text-[#1A0A5E]">Laundry Business Partner</h2>
              <p className="mt-3 text-sm text-slate-600">
                Receive routed orders, set your operational hours, and grow predictable monthly
                revenue through the platform.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li>- Order visibility from partner dashboard</li>
                <li>- Workload status for better route allocation</li>
                <li>- Revenue and commission tracking</li>
              </ul>
              <Link
                href="/partner/signup"
                className="mt-6 inline-flex rounded-xl bg-[#1A0A5E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#120843]"
              >
                Register as Laundry Business
              </Link>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-bold text-[#1A0A5E]">Rider Partner</h2>
              <p className="mt-3 text-sm text-slate-600">
                Handle pickup and delivery tasks across Lagos, track commissions, and request
                withdrawals from your rider portal.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li>- Job assignment and status updates</li>
                <li>- Earnings dashboard with history</li>
                <li>- Availability toggle for dispatch routing</li>
              </ul>
              <Link
                href="/rider/signup"
                className="mt-6 inline-flex rounded-xl bg-[#CC0000] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b70000]"
              >
                Register as Rider
              </Link>
            </article>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
