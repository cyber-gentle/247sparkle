'use client';
import React from 'react';
import { ShoppingBag, Bike, TrendingUp, AlertTriangle, CheckCircle2, Store, ArrowUp } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const KPI_CARDS = [
  {
    id: 'admin-kpi-orders',
    label: 'Orders Today',
    value: '47',
    sub: '+12 vs yesterday',
    trend: 'up',
    trendValue: '+34%',
    icon: ShoppingBag,
    iconBg: 'bg-[#1A0A5E]/10',
    iconColor: 'text-[#1A0A5E]',
    cardBg: 'bg-white',
    border: 'border-gray-100',
    span: 'col-span-1',
  },
  {
    id: 'admin-kpi-revenue',
    label: 'Revenue Today',
    value: '₦184,500',
    sub: '₦142,200 yesterday',
    trend: 'up',
    trendValue: '+29.7%',
    icon: TrendingUp,
    iconBg: 'bg-[#F5C200]/15',
    iconColor: 'text-[#D4A800]',
    cardBg: 'bg-white',
    border: 'border-gray-100',
    span: 'col-span-1 md:col-span-2',
    hero: true,
  },
  {
    id: 'admin-kpi-riders',
    label: 'Active Riders',
    value: '18',
    sub: '6 on a job right now',
    trend: 'neutral',
    trendValue: '24 total',
    icon: Bike,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    cardBg: 'bg-white',
    border: 'border-gray-100',
    span: 'col-span-1',
  },
  {
    id: 'admin-kpi-approvals',
    label: 'Pending Approvals',
    value: '5',
    sub: '3 riders · 2 partners',
    trend: 'alert',
    trendValue: 'Action needed',
    icon: AlertTriangle,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    cardBg: 'bg-amber-50/40',
    border: 'border-amber-200',
    span: 'col-span-1',
  },
  {
    id: 'admin-kpi-completion',
    label: 'Completion Rate',
    value: '94.3%',
    sub: '3 failed this week',
    trend: 'up',
    trendValue: '+1.2%',
    icon: CheckCircle2,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    cardBg: 'bg-white',
    border: 'border-gray-100',
    span: 'col-span-1',
  },
  {
    id: 'admin-kpi-partners',
    label: 'Registered Partners',
    value: '14',
    sub: '9 available · 5 busy',
    trend: 'neutral',
    trendValue: '2 pending',
    icon: Store,
    iconBg: 'bg-[#CC0000]/10',
    iconColor: 'text-[#CC0000]',
    cardBg: 'bg-white',
    border: 'border-gray-100',
    span: 'col-span-1',
  },
];

export default function AdminKPIBento() {
  return (
    // Grid plan: 6 cards → grid-cols-4
    // Row 1: revenue hero (col-span-2) + orders (col-span-1) + riders (col-span-1)
    // Row 2: approvals (col-span-1) + completion (col-span-1) + partners (col-span-1) + filler span
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Hero Revenue Card — spans 2 cols */}
      {(() => {
        const card = KPI_CARDS.find((k) => k.id === 'admin-kpi-revenue')!;
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`col-span-2 ${card.cardBg} rounded-2xl border ${card.border} p-6 shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden`}
          >
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5C200]/8 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon size={22} className={card.iconColor} />
                </div>
                <div className="flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  <ArrowUp size={11} />
                  {card.trendValue}
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#1A0A5E] font-mono-nums mb-1">{card.value}</div>
              <div className="text-sm font-semibold text-gray-500 mb-0.5">{card.label}</div>
              <div className="text-xs text-gray-400">{card.sub}</div>
            </div>
          </div>
        );
      })()}

      {/* Orders Today */}
      {(() => {
        const card = KPI_CARDS.find((k) => k.id === 'admin-kpi-orders')!;
        const Icon = card.icon;
        return (
          <div key={card.id} className={`${card.cardBg} rounded-2xl border ${card.border} p-5 shadow-card hover:shadow-card-hover transition-all duration-300`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <Icon size={18} className={card.iconColor} />
              </div>
              <div className="flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <ArrowUp size={9} />
                {card.trendValue}
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#1A0A5E] font-mono-nums mb-1">{card.value}</div>
            <div className="text-xs font-semibold text-gray-500 mb-0.5">{card.label}</div>
            <div className="text-[11px] text-gray-400">{card.sub}</div>
          </div>
        );
      })()}

      {/* Active Riders */}
      {(() => {
        const card = KPI_CARDS.find((k) => k.id === 'admin-kpi-riders')!;
        const Icon = card.icon;
        return (
          <div key={card.id} className={`${card.cardBg} rounded-2xl border ${card.border} p-5 shadow-card hover:shadow-card-hover transition-all duration-300`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <Icon size={18} className={card.iconColor} />
              </div>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{card.trendValue}</span>
            </div>
            <div className="text-2xl font-extrabold text-[#1A0A5E] font-mono-nums mb-1">{card.value}</div>
            <div className="text-xs font-semibold text-gray-500 mb-0.5">{card.label}</div>
            <div className="text-[11px] text-gray-400">{card.sub}</div>
          </div>
        );
      })()}

      {/* Pending Approvals — Alert */}
      {(() => {
        const card = KPI_CARDS.find((k) => k.id === 'admin-kpi-approvals')!;
        const Icon = card.icon;
        return (
          <div key={card.id} className={`${card.cardBg} rounded-2xl border ${card.border} p-5 shadow-card hover:shadow-card-hover transition-all duration-300`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <Icon size={18} className={card.iconColor} />
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">{card.trendValue}</span>
            </div>
            <div className="text-2xl font-extrabold text-amber-700 font-mono-nums mb-1">{card.value}</div>
            <div className="text-xs font-semibold text-gray-500 mb-0.5">{card.label}</div>
            <div className="text-[11px] text-gray-400">{card.sub}</div>
          </div>
        );
      })()}

      {/* Completion Rate */}
      {(() => {
        const card = KPI_CARDS.find((k) => k.id === 'admin-kpi-completion')!;
        const Icon = card.icon;
        return (
          <div key={card.id} className={`${card.cardBg} rounded-2xl border ${card.border} p-5 shadow-card hover:shadow-card-hover transition-all duration-300`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <Icon size={18} className={card.iconColor} />
              </div>
              <div className="flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <ArrowUp size={9} />
                {card.trendValue}
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#1A0A5E] font-mono-nums mb-1">{card.value}</div>
            <div className="text-xs font-semibold text-gray-500 mb-0.5">{card.label}</div>
            <div className="text-[11px] text-gray-400">{card.sub}</div>
          </div>
        );
      })()}

      {/* Registered Partners */}
      {(() => {
        const card = KPI_CARDS.find((k) => k.id === 'admin-kpi-partners')!;
        const Icon = card.icon;
        return (
          <div key={card.id} className={`${card.cardBg} rounded-2xl border ${card.border} p-5 shadow-card hover:shadow-card-hover transition-all duration-300`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <Icon size={18} className={card.iconColor} />
              </div>
              <span className="text-[10px] font-bold text-[#CC0000] bg-[#CC0000]/10 px-2 py-0.5 rounded-full">{card.trendValue}</span>
            </div>
            <div className="text-2xl font-extrabold text-[#1A0A5E] font-mono-nums mb-1">{card.value}</div>
            <div className="text-xs font-semibold text-gray-500 mb-0.5">{card.label}</div>
            <div className="text-[11px] text-gray-400">{card.sub}</div>
          </div>
        );
      })()}
    </div>
  );
}