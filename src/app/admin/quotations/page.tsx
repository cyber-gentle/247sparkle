'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Quotation = {
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

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/quotations');
        const data = (await response.json()) as { quotations: Quotation[] };
        setQuotations(data.quotations ?? []);
      } catch {
        setFeedback('Failed to load quotations.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function updateStatus(id: string, status: Quotation['status']) {
    setBusyId(id);
    setFeedback('');
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as { quotation?: Quotation; error?: string };
      if (!response.ok || !data.quotation) {
        setFeedback(data.error ?? 'Unable to update status.');
        return;
      }
      setQuotations((prev) => prev.map((item) => (item.id === id ? data.quotation! : item)));
      setFeedback('Quotation status updated.');
    } catch {
      setFeedback('Network error while updating quotation.');
    } finally {
      setBusyId('');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#CC0000]">
            Admin Portal
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#1A0A5E]">Quotation Requests</h1>
          <p className="mt-2 text-sm text-slate-600">
            Review and update quote requests for office and commercial services.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-xl bg-[#1A0A5E] px-4 py-2 text-sm font-semibold text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/finance"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Finance
            </Link>
          </div>
        </header>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? <p className="text-sm text-slate-600">Loading quotations...</p> : null}
          {!loading && quotations.length === 0 ? (
            <p className="text-sm text-slate-600">No quotation requests yet.</p>
          ) : null}
          {!loading && quotations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Service</th>
                    <th className="py-3 pr-4">Contact</th>
                    <th className="py-3 pr-4">Business</th>
                    <th className="py-3 pr-4">Phone</th>
                    <th className="py-3 pr-4">Message</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q) => (
                    <tr key={q.id} className="border-b border-slate-100 align-top">
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 capitalize">{q.serviceType.replaceAll('_', ' ')}</td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-800">{q.contactName}</p>
                        <p className="text-xs text-slate-500">{q.email}</p>
                      </td>
                      <td className="py-3 pr-4">{q.businessName || '-'}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">{q.phone}</td>
                      <td className="py-3 pr-4 max-w-xs text-slate-700">{q.message}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize">
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateStatus(q.id, 'responded')}
                            disabled={busyId === q.id}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50"
                          >
                            Responded
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(q.id, 'converted')}
                            disabled={busyId === q.id}
                            className="rounded-lg bg-[#1A0A5E] px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Convert
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {feedback ? <p className="mt-4 text-sm text-slate-700">{feedback}</p> : null}
        </div>
      </section>
    </main>
  );
}
