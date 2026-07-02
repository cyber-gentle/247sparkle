'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Loader, TrendingUp, Wallet, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';

type Order = {
  id: string;
  totalAmount: number;
  paymentStatus: string;
  serviceType: string;
  createdAt: string;
  commissions: { amount: number; status: string; riderId?: string; partnerId?: string }[];
};

type Stats = {
  totalRevenue: number;
  paidRevenue: number;
  totalCommissions: number;
  pendingCommissions: number;
  orderCount: number;
  paidOrderCount: number;
};

export default function AdminFinancePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      const all: Order[] = data.orders ?? [];
      setOrders(all);

      const totalRevenue = all.reduce((s, o) => s + o.totalAmount, 0);
      const paidRevenue = all.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + o.totalAmount, 0);
      const allCommissions = all.flatMap(o => o.commissions ?? []);
      const totalCommissions = allCommissions.reduce((s, c) => s + c.amount, 0);
      const pendingCommissions = allCommissions.filter(c => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0);

      setStats({
        totalRevenue,
        paidRevenue,
        totalCommissions,
        pendingCommissions,
        orderCount: all.length,
        paidOrderCount: all.filter(o => o.paymentStatus === 'PAID').length,
      });
    } catch {
      toast.error('Failed to load finance data');
    } finally {
      setLoading(false);
    }
  }

  const recentPaid = orders
    .filter(o => o.paymentStatus === 'PAID')
    .slice(0, 20);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#CC0000]">Admin Portal</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#1A0A5E]">Finance</h1>
          <p className="mt-1 text-sm text-slate-600">Revenue, commissions, and transaction overview.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/admin/dashboard" className="rounded-xl bg-[#1A0A5E] px-4 py-2 text-sm font-semibold text-white">Dashboard</Link>
            <Link href="/admin/orders" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Orders</Link>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="animate-spin text-[#1A0A5E]" size={28} />
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: `₦${stats!.totalRevenue.toLocaleString()}`, sub: `${stats!.orderCount} orders`, icon: TrendingUp, color: 'text-[#1A0A5E]' },
                { label: 'Paid Revenue', value: `₦${stats!.paidRevenue.toLocaleString()}`, sub: `${stats!.paidOrderCount} paid orders`, icon: DollarSign, color: 'text-green-600' },
                { label: 'Total Commissions', value: `₦${stats!.totalCommissions.toLocaleString()}`, sub: 'Rider + partner', icon: Wallet, color: 'text-purple-600' },
                { label: 'Pending Commissions', value: `₦${stats!.pendingCommissions.toLocaleString()}`, sub: 'Awaiting payout', icon: Clock, color: 'text-amber-600' },
              ].map(card => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
                      <Icon size={20} className={card.color} />
                    </div>
                    <p className={`text-2xl font-extrabold ${card.color}`}>{card.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
                  </div>
                );
              })}
            </div>

            {/* Recent paid orders */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-[#1A0A5E]">Recent Paid Transactions</h2>
              </div>
              {recentPaid.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">No paid transactions yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Order</th>
                        <th className="px-5 py-3">Service</th>
                        <th className="px-5 py-3">Amount</th>
                        <th className="px-5 py-3">Commission</th>
                        <th className="px-5 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPaid.map(order => {
                        const commission = (order.commissions ?? []).reduce((s, c) => s + c.amount, 0);
                        return (
                          <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-5 py-3 font-mono text-xs text-slate-500">ORD-{order.id.slice(0, 6).toUpperCase()}</td>
                            <td className="px-5 py-3 text-slate-600">{order.serviceType.replace(/_/g, ' ')}</td>
                            <td className="px-5 py-3 font-semibold text-[#1A0A5E]">₦{order.totalAmount.toLocaleString()}</td>
                            <td className="px-5 py-3 text-purple-600 font-semibold">{commission > 0 ? `₦${commission.toLocaleString()}` : '—'}</td>
                            <td className="px-5 py-3 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
