'use client';

import { FormEvent, useMemo, useState } from 'react';

import PublicFooter from '@/components/PublicFooter';
import PublicNavbar from '@/components/PublicNavbar';

type VerificationResponse = {
  valid: boolean;
  message?: string;
  certificate?: {
    certificateNumber: string;
    customerName: string;
    propertyAddress: string;
    propertyType: string;
    serviceDate: string;
    serviceType: 'fumigation';
  };
};

function formatServiceDate(dateString: string) {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
}

export default function VerifyCertificatePage() {
  const [certificateNumber, setCertificateNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);

  const normalizedInput = useMemo(
    () => certificateNumber.trim().toUpperCase(),
    [certificateNumber]
  );

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!normalizedInput) {
      setResult({ valid: false, message: 'Please enter a certificate number.' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/certificates/verify/${encodeURIComponent(normalizedInput)}`
      );
      const payload = (await response.json()) as VerificationResponse;

      if (!response.ok) {
        setResult({
          valid: false,
          message: payload.message ?? 'Certificate could not be validated.',
        });
        return;
      }

      setResult(payload);
    } catch {
      setResult({
        valid: false,
        message: 'Unable to verify at the moment. Please try again shortly.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-slate-50 pb-20 pt-24">
        <section className="mx-auto w-full max-w-4xl px-6 lg:px-10">
          <div className="public-card public-card-accent">
            <div className="public-card-body">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#CC0000]">
                    Public Verification
                  </p>
                  <h1 className="text-3xl font-extrabold text-[#1A0A5E]">
                    Verify Fumigation Certificate
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Enter a certificate number to validate its authenticity in the 247 Sparkle
                    records.
                  </p>
                </div>
                <span className="public-pill w-fit">No login required</span>
              </div>

              <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleVerify}>
                <input
                  type="text"
                  value={certificateNumber}
                  onChange={(event) => setCertificateNumber(event.target.value.toUpperCase())}
                  placeholder="SPKFUM-2026-00001"
                  aria-label="Certificate Number"
                  className="public-field h-11 flex-1 py-0 uppercase"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-xl bg-[#1A0A5E] px-6 text-sm font-semibold text-white transition hover:bg-[#120843] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </form>

              <p className="mt-3 text-xs text-slate-500">Example: SPKFUM-2026-00001</p>

              {result ? (
                result.valid && result.certificate ? (
                  <div className="mt-6 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-950">
                    <div className="flex items-center justify-between gap-4 border-b border-emerald-200 bg-white/70 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                        Valid Certificate
                      </p>
                      <span className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                        Verified
                      </span>
                    </div>
                    <dl className="grid gap-0 sm:grid-cols-2">
                      {[
                        ['Certificate Number', result.certificate.certificateNumber],
                        ['Customer Name', result.certificate.customerName],
                        ['Property Address', result.certificate.propertyAddress],
                        ['Service Type', result.certificate.serviceType],
                        ['Property Type', result.certificate.propertyType],
                        ['Date of Service', formatServiceDate(result.certificate.serviceDate)],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="border-b border-emerald-200 px-4 py-3 last:border-b-0 sm:odd:border-r"
                        >
                          <dt className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                            {label}
                          </dt>
                          <dd className="mt-1 font-semibold">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                        Invalid Certificate
                      </p>
                      <span className="rounded-full bg-rose-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                        Not found
                      </span>
                    </div>
                    <p className="mt-2">
                      {result.message ?? 'Certificate could not be validated.'}
                    </p>
                  </div>
                )
              ) : null}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
