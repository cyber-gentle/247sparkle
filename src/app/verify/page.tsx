import PublicFooter from '@/components/PublicFooter';
import PublicNavbar from '@/components/PublicNavbar';

export default function VerifyCertificatePage() {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-slate-50 pb-20 pt-24">
        <section className="mx-auto w-full max-w-4xl px-6 lg:px-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#CC0000]">
              Public Verification
            </p>
            <h1 className="text-3xl font-extrabold text-[#1A0A5E]">
              Verify Fumigation Certificate
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              Enter a certificate number to validate its authenticity. API integration will connect
              this form to certificate records.
            </p>
            <form className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                placeholder="SPKFUM-2026-00001"
                className="h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-[#1A0A5E]"
              />
              <button
                type="submit"
                className="h-11 rounded-xl bg-[#1A0A5E] px-6 text-sm font-semibold text-white transition hover:bg-[#120843]"
              >
                Verify
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Sample Response UI
              </p>
              <p className="mt-2 text-sm text-emerald-900">
                Valid certificate. Customer: Adaeze Okonkwo. Service Date: 24/04/2026. Property:
                2 Rooms Apartment.
              </p>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
