'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Certificate = {
  certificateNumber: string;
  customerName: string;
  propertyAddress: string;
  propertyType: string;
  serviceDate: string;
};

export default function CustomerCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCertificates() {
      try {
        const response = await fetch('/api/certificates/customer/demo-user');
        const data = (await response.json()) as { certificates?: Certificate[] };
        setCertificates(data.certificates ?? []);
      } catch {
        setError('Failed to load certificates.');
      } finally {
        setLoading(false);
      }
    }

    loadCertificates();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#CC0000]">
            Customer Portal
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#1A0A5E]">Fumigation Certificates</h1>
          <p className="mt-2 text-sm text-slate-600">
            Download and verify certificates issued after completed fumigation services.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/verify"
              className="rounded-xl bg-[#1A0A5E] px-4 py-2 text-sm font-semibold text-white"
            >
              Verify Certificate
            </Link>
            <Link
              href="/customer/dashboard"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Dashboard
            </Link>
          </div>
        </header>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? <p className="text-sm text-slate-600">Loading certificates...</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {!loading && !error && certificates.length === 0 ? (
            <p className="text-sm text-slate-600">No certificates found yet.</p>
          ) : null}
          {!loading && !error && certificates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Certificate No.</th>
                    <th className="py-3 pr-4">Property</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Service Date</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((item) => (
                    <tr key={item.certificateNumber} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-medium text-slate-800">
                        {item.certificateNumber}
                      </td>
                      <td className="py-3 pr-4">{item.propertyAddress}</td>
                      <td className="py-3 pr-4">{item.propertyType}</td>
                      <td className="py-3 pr-4">{item.serviceDate}</td>
                      <td className="py-3">
                        <Link
                          href={`/verify?number=${encodeURIComponent(item.certificateNumber)}`}
                          className="text-sm font-semibold text-[#1A0A5E] hover:underline"
                        >
                          Verify
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
