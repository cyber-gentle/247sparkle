'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Store, MessageSquare, ChevronRight, Clock, Loader } from 'lucide-react';
import { toast } from 'sonner';

type PendingRider = { id: string; user: { fullName: string; phone: string | null }; createdAt: string };
type PendingPartner = { id: string; businessName: string; ownerName: string; user: { fullName: string }; createdAt: string };
type Quotation = { id: string; serviceType: string; businessName: string | null; contactName: string | null; createdAt: string };

export default function AlertsPanel() {
  const [pendingRiders, setPendingRiders] = useState<PendingRider[]>([]);
  const [pendingPartners, setPendingPartners] = useState<PendingPartner[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => {
        setPendingRiders(d.pendingRiders ?? []);
        setPendingPartners(d.pendingPartners ?? []);
        setQuotations(d.recentQuotations ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleRiderAction(id: string, action: 'APPROVE' | 'REJECT', name: string) {
    try {
      const res = await fetch(`/api/admin/riders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${name} ${action === 'APPROVE' ? 'approved' : 'rejected'}`);
      setPendingRiders((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error('Action failed');
    }
  }

  async function handlePartnerAction(id: string, action: 'APPROVE' | 'REJECT', name: string) {
    try {
      const res = await fetch(`/api/admin/partners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${name} ${action === 'APPROVE' ? 'approved' : 'rejected'}`);
      setPendingPartners((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error('Action failed');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-[#1A0A5E]" size={22} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Pending Riders */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800">Rider Approvals</h3>
            <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">
              {pendingRiders.length}
            </span>
          </div>
          <Link href="/admin/riders" className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1">
            Manage All <ChevronRight size={12} />
          </Link>
        </div>
        {pendingRiders.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">No pending rider approvals.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingRiders.map((rider) => (
              <div key={rider.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1A0A5E]/10 text-[#1A0A5E] text-xs font-bold flex items-center justify-center shrink-0">
                    {rider.user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-700">{rider.user.fullName}</div>
                    <div className="text-[11px] text-gray-400">{rider.user.phone ?? '—'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleRiderAction(rider.id, 'APPROVE', rider.user.fullName)}
                    className="text-[11px] font-bold bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRiderAction(rider.id, 'REJECT', rider.user.fullName)}
                    className="text-[11px] font-bold bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Partners */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store size={15} className="text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800">Partner Approvals</h3>
            <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">
              {pendingPartners.length}
            </span>
          </div>
          <Link href="/admin/partners" className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1">
            Manage All <ChevronRight size={12} />
          </Link>
        </div>
        {pendingPartners.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">No pending partner approvals.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingPartners.map((partner) => (
              <div key={partner.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#CC0000]/10 text-[#CC0000] text-xs font-bold flex items-center justify-center shrink-0">
                    <Store size={14} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-700">{partner.businessName}</div>
                    <div className="text-[11px] text-gray-400">{partner.ownerName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePartnerAction(partner.id, 'APPROVE', partner.businessName)}
                    className="text-[11px] font-bold bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handlePartnerAction(partner.id, 'REJECT', partner.businessName)}
                    className="text-[11px] font-bold bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quotation Requests */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={15} className="text-[#1A0A5E]" />
            <h3 className="text-sm font-bold text-[#1A0A5E]">Quotation Requests</h3>
            <span className="text-[10px] font-bold bg-[#1A0A5E]/10 text-[#1A0A5E] px-1.5 py-0.5 rounded-full">
              {quotations.length}
            </span>
          </div>
          <Link href="/admin/quotations" className="text-xs font-bold text-[#CC0000] hover:underline flex items-center gap-1">
            View All <ChevronRight size={12} />
          </Link>
        </div>
        {quotations.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">No new quotation requests.</p>
        ) : (
          <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
            {quotations.map((q) => (
              <div key={q.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-[#1A0A5E]">{q.businessName ?? q.contactName ?? '—'}</span>
                    <span className="text-[10px] bg-[#1A0A5E]/8 text-[#1A0A5E] px-1.5 py-0.5 rounded-full font-semibold">
                      {q.serviceType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Clock size={10} />
                    {new Date(q.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Link
                  href="/admin/quotations"
                  className="text-[11px] font-bold text-[#CC0000] hover:bg-[#CC0000]/10 px-2.5 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  Respond
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
