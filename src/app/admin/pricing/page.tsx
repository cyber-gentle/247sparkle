'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type PricingItem = {
  id: string;
  serviceType: 'laundry' | 'fumigation';
  itemName: string;
  unitPrice: number;
  updatedAt: string;
};

export default function AdminPricingPage() {
  const [items, setItems] = useState<PricingItem[]>([]);
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/pricing');
        const data = (await response.json()) as { pricing: PricingItem[] };
        setItems(data.pricing ?? []);
      } catch {
        setStatus('Failed to load pricing data.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const dirtyIds = useMemo(
    () => Object.keys(editedPrices).filter((id) => editedPrices[id] !== ''),
    [editedPrices]
  );

  async function saveChanges() {
    if (dirtyIds.length === 0) {
      setStatus('No changes to save.');
      return;
    }

    const updates = dirtyIds.map((id) => ({
      id,
      unitPrice: Number(editedPrices[id]),
    }));
    if (updates.some((item) => !Number.isFinite(item.unitPrice) || item.unitPrice <= 0)) {
      setStatus('Enter valid numeric prices greater than zero.');
      return;
    }

    setSaving(true);
    setStatus('');
    try {
      const response = await fetch('/api/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const data = (await response.json()) as {
        updated?: PricingItem[];
        error?: string;
      };
      if (!response.ok) {
        setStatus(data.error ?? 'Failed to save pricing updates.');
        return;
      }

      setItems((prev) =>
        prev.map((item) => data.updated?.find((row) => row.id === item.id) ?? item)
      );
      setEditedPrices({});
      setStatus('Pricing updates saved.');
    } catch {
      setStatus('Network error while saving pricing.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#CC0000]">
            Admin Portal
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#1A0A5E]">Pricing Management</h1>
          <p className="mt-2 text-sm text-slate-600">
            Update laundry and fumigation prices. Changes apply immediately to booking flows.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-xl bg-[#1A0A5E] px-4 py-2 text-sm font-semibold text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/orders"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Orders
            </Link>
          </div>
        </header>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? <p className="text-sm text-slate-600">Loading pricing...</p> : null}
          {!loading ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Service</th>
                    <th className="py-3 pr-4">Item</th>
                    <th className="py-3 pr-4">Unit Price (NGN)</th>
                    <th className="py-3">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-medium capitalize">
                        {item.serviceType.replace('_', ' ')}
                      </td>
                      <td className="py-3 pr-4">{item.itemName}</td>
                      <td className="py-3 pr-4">
                        <input
                          type="number"
                          min={1}
                          value={editedPrices[item.id] ?? String(item.unitPrice)}
                          onChange={(event) =>
                            setEditedPrices((prev) => ({
                              ...prev,
                              [item.id]: event.target.value,
                            }))
                          }
                          className="w-40 rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              disabled={saving || loading}
              onClick={saveChanges}
              className="rounded-xl bg-[#1A0A5E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Updates'}
            </button>
            {status ? <p className="text-sm text-slate-700">{status}</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
