'use client';
import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Store, MessageSquare, ChevronRight, Clock } from 'lucide-react';
import { toast } from 'sonner';

const PENDING_RIDERS = [
  { id: 'rider-pending-001', name: 'Chidi Okafor', phone: '08134567890', applied: '2 hrs ago', area: 'Ikeja' },
  { id: 'rider-pending-002', name: 'Yusuf Abdullahi', phone: '07056789012', applied: '4 hrs ago', area: 'Surulere' },
  { id: 'rider-pending-003', name: 'Kingsley Nnamdi', phone: '09012345678', applied: '6 hrs ago', area: 'Lekki' },
];

const PENDING_PARTNERS = [
  { id: 'partner-pending-001', name: 'Fresh & Clean Laundry', owner: 'Mrs. Adeola Bello', applied: '1 day ago', area: 'Mushin' },
  { id: 'partner-pending-002', name: 'SparkWash Services', owner: 'Mr. Emeka Igwe', applied: '2 days ago', area: 'Oshodi' },
];

const QUOTATION_REQUESTS = [
  { id: 'quote-001', type: 'Office Cleaning', business: 'Zenith Technologies Ltd', contact: 'Bola Adesanya', time: '30 mins ago' },
  { id: 'quote-002', type: 'Commercial Fumigation', business: 'Otukpo Suites Hotel', contact: 'Mr. Eze', time: '2 hrs ago' },
  { id: 'quote-003', type: 'Office Cleaning', business: 'TechBridge Consulting', contact: 'Aisha Mohammed', time: '3 hrs ago' },
  { id: 'quote-004', type: 'Office Fumigation', business: 'Greenfield Pharmacy', contact: 'Dr. Obi', time: '5 hrs ago' },
  { id: 'quote-005', type: 'Commercial Fumigation', business: 'Mega Warehouse, Apapa', contact: 'Logistics Mgr', time: 'Yesterday' },
];

export default function AlertsPanel() {
  const handleApprove = (name: string, type: string) => {
    // TODO: Backend — PUT /api/riders/:id/approve or PUT /api/partners/:id/approve
    toast.success(`${name} approved as ${type}`);
  };

  const handleReject = (name: string) => {
    // TODO: Backend — PUT /api/riders/:id/reject
    toast.error(`${name} application rejected`);
  };

  return (
    <div className="space-y-5">
      {/* Pending Riders */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800">Rider Approvals</h3>
            <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">
              {PENDING_RIDERS.length}
            </span>
          </div>
          <Link href="/admin-dashboard" className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1">
            Manage All <ChevronRight size={12} />
          </Link>
        </div>

        <div className="divide-y divide-gray-50">
          {PENDING_RIDERS.map((rider) => (
            <div key={rider.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1A0A5E]/10 text-[#1A0A5E] text-xs font-bold flex items-center justify-center shrink-0">
                  {rider.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700">{rider.name}</div>
                  <div className="text-[11px] text-gray-400">{rider.area} · {rider.applied}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleApprove(rider.name, 'Rider')}
                  className="text-[11px] font-bold bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(rider.name)}
                  className="text-[11px] font-bold bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Partners */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store size={15} className="text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800">Partner Approvals</h3>
            <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">
              {PENDING_PARTNERS.length}
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {PENDING_PARTNERS.map((partner) => (
            <div key={partner.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#CC0000]/10 text-[#CC0000] text-xs font-bold flex items-center justify-center shrink-0">
                  <Store size={14} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700">{partner.name}</div>
                  <div className="text-[11px] text-gray-400">{partner.owner} · {partner.area} · {partner.applied}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleApprove(partner.name, 'Partner')}
                  className="text-[11px] font-bold bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(partner.name)}
                  className="text-[11px] font-bold bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quotation Requests */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={15} className="text-[#1A0A5E]" />
            <h3 className="text-sm font-bold text-[#1A0A5E]">Quotation Requests</h3>
            <span className="text-[10px] font-bold bg-[#1A0A5E]/10 text-[#1A0A5E] px-1.5 py-0.5 rounded-full">
              {QUOTATION_REQUESTS.length}
            </span>
          </div>
          <Link href="/admin-dashboard" className="text-xs font-bold text-[#CC0000] hover:underline flex items-center gap-1">
            View All <ChevronRight size={12} />
          </Link>
        </div>

        <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
          {QUOTATION_REQUESTS.map((q) => (
            <div key={q.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors group">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-[#1A0A5E]">{q.business}</span>
                  <span className="text-[10px] bg-[#1A0A5E]/8 text-[#1A0A5E] px-1.5 py-0.5 rounded-full font-semibold">{q.type}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <Clock size={10} />
                  {q.contact} · {q.time}
                </div>
              </div>
              <button
                className="text-[11px] font-bold text-[#CC0000] hover:bg-[#CC0000]/10 px-2.5 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                // TODO: Backend — open quotation response modal
              >
                Respond
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}