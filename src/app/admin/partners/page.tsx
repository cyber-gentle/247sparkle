'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, ShieldOff, Loader } from 'lucide-react';
import { toast } from 'sonner';

type Partner = {
  id: string;
  businessName: string;
  ownerName: string;
  address: string;
  approvalStatus: string;
  workloadStatus: string;
  createdAt: string;
  user: { fullName: string; email: string; phone: string };
  assignedOrders: { id: string }[];
};

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-gray-100 text-gray-600',
};

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch('/api/admin/partners');
      const data = await res.json();
      setPartners(data.partners ?? []);
    } catch {
      toast.error('Failed to load partners');
    } finally {
      setLoading(false);
    }
  }

  async function updatePartner(id: string, action: 'APPROVE' | 'REJECT' | 'SUSPEND') {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/partners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Action failed'); return; }
      setPartners(prev => prev.map(p => p.id === id ? { ...p, approvalStatus: data.partner.approvalStatus } : p));
      toast.success(`Partner ${action.toLowerCase()}d`);
    } catch {
      toast.error('Network error');
    } finally {
      setBusyId('');
    }
  }

  const filtered = filter === 'ALL' ? partners : partners.filter(p => p.approvalStatus === filter);
  const counts = {
    ALL: partners.length,
    PENDING: partners.filter(p => p.approvalStatus === 'PENDING').length,
    APPROVED: partners.filter(p => p.approvalStatus === 'APPROVED').length,
    SUSPENDED: partners.filter(p => p.approvalStatus === 'SUSPENDED').length,
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#CC0000]">Admin Portal</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#1A0A5E]">Partners Management</h1>
          <p className="mt-1 text-sm text-slate-600">Review partner onboarding, workload visibility, and partner-level earnings.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/admin/dashboard" className="rounded-xl bg-[#1A0A5E] px-4 py-2 text-sm font-semibold text-white">Dashboard</Link>
            <Link href="/admin/riders" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Riders</Link>
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

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="animate-spin text-[#1A0A5E]" size={28} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">No partners found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Business</th>
                    <th className="px-5 py-3">Owner</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Workload</th>
                    <th className="px-5 py-3">Orders</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(partner => (
                    <tr key={partner.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{partner.businessName}</p>
                        <p className="text-xs text-slate-500">{partner.user.email}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{partner.ownerName}</td>
                      <td className="px-5 py-4 text-slate-600">{partner.user.phone || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COLORS[partner.approvalStatus] ?? 'bg-slate-100 text-slate-600'}`}>
                          {partner.approvalStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold ${partner.workloadStatus === 'AVAILABLE' ? 'text-green-600' : 'text-slate-400'}`}>
                          {partner.workloadStatus === 'AVAILABLE' ? '● Available' : '○ Busy'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{partner.assignedOrders.length}</td>
                      <td className="px-5 py-4 text-slate-500">{new Date(partner.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        {busyId === partner.id ? (
                          <Loader size={16} className="animate-spin text-slate-400" />
                        ) : (
                          <div className="flex gap-1.5">
                            {partner.approvalStatus !== 'APPROVED' && (
                              <button onClick={() => updatePartner(partner.id, 'APPROVE')} title="Approve"
                                className="rounded-lg bg-green-600 p-1.5 text-white hover:bg-green-700">
                                <CheckCircle size={14} />
                              </button>
                            )}
                            {partner.approvalStatus === 'PENDING' && (
                              <button onClick={() => updatePartner(partner.id, 'REJECT')} title="Reject"
                                className="rounded-lg bg-red-500 p-1.5 text-white hover:bg-red-600">
                                <XCircle size={14} />
                              </button>
                            )}
                            {partner.approvalStatus === 'APPROVED' && (
                              <button onClick={() => updatePartner(partner.id, 'SUSPEND')} title="Suspend"
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
