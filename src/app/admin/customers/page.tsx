'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Loader, Search } from 'lucide-react';
import { toast } from 'sonner';

type CustomerRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderDate: string | null;
  joinedAt: string;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      setCustomers(data.customers ?? []);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || c.fullName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#CC0000]">Admin Portal</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#1A0A5E]">Customers</h1>
          <p className="mt-1 text-sm text-slate-600">Customer records, contact details, and lifetime order activity.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/admin/dashboard" className="rounded-xl bg-[#1A0A5E] px-4 py-2 text-sm font-semibold text-white">Dashboard</Link>
            <Link href="/admin/orders" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Orders</Link>
          </div>
        </header>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A0A5E]"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="animate-spin text-[#1A0A5E]" size={28} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">No customers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Total Orders</th>
                    <th className="px-5 py-3">Total Spend</th>
                    <th className="px-5 py-3">Last Order</th>
                    <th className="px-5 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{c.fullName}</p>
                        <p className="text-xs text-slate-500">{c.email}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{c.phone}</td>
                      <td className="px-5 py-4 text-slate-700 font-semibold">{c.totalOrders}</td>
                      <td className="px-5 py-4 font-semibold text-[#1A0A5E]">₦{c.totalSpend.toLocaleString()}</td>
                      <td className="px-5 py-4 text-slate-500">{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-4 text-slate-500">{new Date(c.joinedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
