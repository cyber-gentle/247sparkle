'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Loader, Search } from 'lucide-react';
import { toast } from 'sonner';

type Order = {
  id: string;
  serviceType: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  customer: { user: { fullName: string; email: string; phone: string } };
  rider?: { user: { fullName: string } } | null;
  partner?: { businessName: string } | null;
  items: { id: string }[];
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  RIDER_ASSIGNED: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-indigo-100 text-indigo-700',
  IN_CLEANING: 'bg-purple-100 text-purple-700',
  OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const PAYMENT_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  UNPAID: 'bg-rose-100 text-rose-700',
  FAILED: 'bg-red-100 text-red-700',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  const filtered = orders.filter(o => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      o.customer.user.fullName.toLowerCase().includes(q) ||
      o.customer.user.email.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      o.serviceType.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const statuses = ['ALL', 'PENDING', 'RIDER_ASSIGNED', 'PICKED_UP', 'IN_CLEANING', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#CC0000]">Admin Portal</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#1A0A5E]">Orders Management</h1>
          <p className="mt-1 text-sm text-slate-600">Monitor all platform orders across every service type and status.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/admin/dashboard" className="rounded-xl bg-[#1A0A5E] px-4 py-2 text-sm font-semibold text-white">Dashboard</Link>
            <Link href="/admin/riders" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Riders</Link>
            <Link href="/admin/pricing" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Pricing</Link>
          </div>
        </header>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer, email, order ID, or service…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A0A5E]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A0A5E]"
          >
            {statuses.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="animate-spin text-[#1A0A5E]" size={28} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Order</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Service</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Rider</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => (
                    <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">
                        ORD-{order.id.slice(0, 6).toUpperCase()}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{order.customer.user.fullName}</p>
                        <p className="text-xs text-slate-500">{order.customer.user.phone}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{order.serviceType.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${PAYMENT_COLORS[order.paymentStatus] ?? 'bg-slate-100 text-slate-600'}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#1A0A5E]">₦{order.totalAmount.toLocaleString()}</td>
                      <td className="px-5 py-4 text-slate-600">{order.rider?.user.fullName ?? '—'}</td>
                      <td className="px-5 py-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
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
