'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, ShieldOff, Loader, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

type Rider = {
  id: string;
  approvalStatus: string;
  availabilityStatus: string;
  walletBalance: number;
  createdAt: string;
  user: { fullName: string; email: string; phone: string };
  assignedOrders: { id: string }[];
  commissions: { amount: number; status: string }[];
};

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-gray-100 text-gray-600',
};

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch('/api/admin/riders');
      const data = await res.json();
      setRiders(data.riders ?? []);
    } catch {
      toast.error('Failed to load riders');
    } finally {
      setLoading(false);
    }
  }

  async function updateRider(id: string, action: 'APPROVE' | 'REJECT' | 'SUSPEND') {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/riders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Action failed'); return; }
      setRiders(prev => prev.map(r => r.id === id ? { ...r, approvalStatus: data.rider.approvalStatus } : r));
      toast.success(`Rider ${action.toLowerCase()}d`);
    } catch {
      toast.error('Network error');
    } finally {
      setBusyId('');
    }
  }

  const filtered = filter === 'ALL' ? riders : riders.filter(r => r.approvalStatus === filter);
  const counts = {
    ALL: riders.length,
    PENDING: riders.filter(r => r.approvalStatus === 'PENDING').length,
    APPROVED: riders.filter(r => r.approvalStatus === 'APPROVED').length,
    SUSPENDED: riders.filter(r => r.approvalStatus === 'SUSPENDED').length,
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#CC0000]">Admin Portal</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#1A0A5E]">Riders Management</h1>
          <p className="mt-1 text-sm text-slate-600">Approve applications, monitor availability, and manage rider accounts.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/admin/dashboard" className="rounded-xl bg-[#1A0A5E] px-4 py-2 text-sm font-semibold text-white">Dashboard</Link>
            <Link href="/admin/partners" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Partners</Link>
            <Link href="/admin/orders" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Orders</Link>
          </div>
        </header>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'PENDING', 'APPROVED', 'SUSPENDED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${filter === s ? 'bg-[#1A0A5E] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#1A0A5E]'}`}
            >
              {s} <span className="ml-1 opacity-70">({counts[s]})</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="animate-spin text-[#1A0A5E]" size={28} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">No riders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Rider</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Availability</th>
                    <th className="px-5 py-3">Orders</th>
                    <th className="px-5 py-3">Wallet</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(rider => (
                    <tr key={rider.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{rider.user.fullName}</p>
                        <p className="text-xs text-slate-500">{rider.user.email}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{rider.user.phone || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COLORS[rider.approvalStatus] ?? 'bg-slate-100 text-slate-600'}`}>
                          {rider.approvalStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold ${rider.availabilityStatus === 'WORKING' ? 'text-green-600' : 'text-slate-400'}`}>
                          {rider.availabilityStatus === 'WORKING' ? '● On Duty' : '○ Off Duty'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{rider.assignedOrders.length}</td>
                      <td className="px-5 py-4 font-semibold text-[#1A0A5E]">₦{rider.walletBalance.toLocaleString()}</td>
                      <td className="px-5 py-4 text-slate-500">{new Date(rider.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        {busyId === rider.id ? (
                          <Loader size={16} className="animate-spin text-slate-400" />
                        ) : (
                          <div className="flex gap-1.5">
                            {rider.approvalStatus !== 'APPROVED' && (
                              <button onClick={() => updateRider(rider.id, 'APPROVE')} title="Approve"
                                className="rounded-lg bg-green-600 p-1.5 text-white hover:bg-green-700">
                                <CheckCircle size={14} />
                              </button>
                            )}
                            {rider.approvalStatus === 'PENDING' && (
                              <button onClick={() => updateRider(rider.id, 'REJECT')} title="Reject"
                                className="rounded-lg bg-red-500 p-1.5 text-white hover:bg-red-600">
                                <XCircle size={14} />
                              </button>
                            )}
                            {rider.approvalStatus === 'APPROVED' && (
                              <button onClick={() => updateRider(rider.id, 'SUSPEND')} title="Suspend"
                                className="rounded-lg bg-amber-500 p-1.5 text-white hover:bg-amber-600">
                                <ShieldOff size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
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
