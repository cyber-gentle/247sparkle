'use client';
import React, { useEffect, useState } from 'react';
import { ShoppingBag, Bike, TrendingUp, AlertTriangle, CheckCircle2, Store, ArrowUp, Loader } from 'lucide-react';

type KPIs = {
  ordersToday: number;
  revenueToday: number;
  activeRiders: number;
  onJobRiders: number;
  pendingApprovals: number;
  pendingRiderApprovals: number;
  pendingPartnerApprovals: number;
  completionRate: string;
  totalPartners: number;
  availablePartners: number;
};

export default function AdminKPIBento() {
  const [kpis, setKpis] = useState<KPIs | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => setKpis(d.kpis))
      .catch(console.error);
  }, []);

  if (!kpis) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-[#1A0A5E]" size={24} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Hero Revenue Card */}
      <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5C200]/8 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#F5C200]/15 flex items-center justify-center">
              <TrendingUp size={22} className="text-[#D4A800]" />
            </div>
            <div className="flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
              <ArrowUp size={11} />
              Today
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#1A0A5E] font-mono-nums mb-1">
            ₦{kpis.revenueToday.toLocaleString()}
          </div>
          <div className="text-sm font-semibold text-gray-500 mb-0.5">Revenue Today</div>
          <div className="text-xs text-gray-400">{kpis.ordersToday} orders placed today</div>
        </div>
      </div>

      {/* Orders Today */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A0A5E]/10 flex items-center justify-center">
            <ShoppingBag size={18} className="text-[#1A0A5E]" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-[#1A0A5E] font-mono-nums mb-1">{kpis.ordersToday}</div>
        <div className="text-xs font-semibold text-gray-500 mb-0.5">Orders Today</div>
        <div className="text-[11px] text-gray-400">All service types</div>
      </div>

      {/* Active Riders */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Bike size={18} className="text-green-600" />
          </div>
          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            {kpis.onJobRiders} on job
          </span>
        </div>
        <div className="text-2xl font-extrabold text-[#1A0A5E] font-mono-nums mb-1">{kpis.activeRiders}</div>
        <div className="text-xs font-semibold text-gray-500 mb-0.5">Active Riders</div>
        <div className="text-[11px] text-gray-400">Currently working</div>
      </div>

      {/* Pending Approvals */}
      <div className={`rounded-2xl border p-5 shadow-card hover:shadow-card-hover transition-all duration-300 ${kpis.pendingApprovals > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-gray-100'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          {kpis.pendingApprovals > 0 && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
              Action needed
            </span>
          )}
        </div>
        <div className="text-2xl font-extrabold text-amber-700 font-mono-nums mb-1">{kpis.pendingApprovals}</div>
        <div className="text-xs font-semibold text-gray-500 mb-0.5">Pending Approvals</div>
        <div className="text-[11px] text-gray-400">
          {kpis.pendingRiderApprovals} riders · {kpis.pendingPartnerApprovals} partners
        </div>
      </div>

      {/* Completion Rate */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-green-600" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-[#1A0A5E] font-mono-nums mb-1">{kpis.completionRate}%</div>
        <div className="text-xs font-semibold text-gray-500 mb-0.5">Completion Rate</div>
        <div className="text-[11px] text-gray-400">All-time orders</div>
      </div>

      {/* Registered Partners */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#CC0000]/10 flex items-center justify-center">
            <Store size={18} className="text-[#CC0000]" />
          </div>
          <span className="text-[10px] font-bold text-[#CC0000] bg-[#CC0000]/10 px-2 py-0.5 rounded-full">
            {kpis.availablePartners} available
          </span>
        </div>
        <div className="text-2xl font-extrabold text-[#1A0A5E] font-mono-nums mb-1">{kpis.totalPartners}</div>
        <div className="text-xs font-semibold text-gray-500 mb-0.5">Registered Partners</div>
        <div className="text-[11px] text-gray-400">Approved laundry shops</div>
      </div>
    </div>
  );
}
