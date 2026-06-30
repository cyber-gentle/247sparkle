import React from 'react';
import { Package, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const KPI_DATA = [
  {
    id: 'kpi-total',
    label: 'Total Orders',
    value: '24',
    sub: 'Since joining',
    icon: Package,
    iconBg: 'bg-[#1A0A5E]/10',
    iconColor: 'text-[#1A0A5E]',
    trend: null,
  },
  {
    id: 'kpi-active',
    label: 'Active Orders',
    value: '3',
    sub: '1 out for delivery',
    icon: Clock,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    trend: 'alert',
  },
  {
    id: 'kpi-completed',
    label: 'Completed',
    value: '20',
    sub: '83% completion rate',
    icon: CheckCircle2,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    trend: 'positive',
  },
  {
    id: 'kpi-spent',
    label: 'Total Spent',
    value: '₦47,200',
    sub: 'This year',
    icon: TrendingUp,
    iconBg: 'bg-[#CC0000]/10',
    iconColor: 'text-[#CC0000]',
    trend: null,
  },
];

export default function CustomerKPICards() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {KPI_DATA?.map((kpi) => {
        const Icon = kpi?.icon;
        return (
          <div
            key={kpi?.id}
            className={`bg-white rounded-2xl p-5 border shadow-card hover:shadow-card-hover transition-all duration-300 ${
              kpi?.trend === 'alert' ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${kpi?.iconBg} flex items-center justify-center`}>
                <Icon size={18} className={kpi?.iconColor} />
              </div>
              {kpi?.trend === 'positive' && (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Good</span>
              )}
              {kpi?.trend === 'alert' && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">Live</span>
              )}
            </div>
            <div className="text-2xl font-extrabold text-[#1A0A5E] font-mono-nums mb-1">{kpi?.value}</div>
            <div className="text-xs font-semibold text-gray-500 mb-0.5">{kpi?.label}</div>
            <div className="text-[11px] text-gray-400">{kpi?.sub}</div>
          </div>
        );
      })}
    </div>
  );
}