import React from 'react';
import { Package, Clock, CheckCircle2, TrendingUp, Loader } from 'lucide-react';

interface CustomerKPICardsProps {
  totalOrders?: number;
  activeOrders?: number;
  completedOrders?: number;
  totalSpent?: number;
  isLoading?: boolean;
}

export default function CustomerKPICards({
  totalOrders = 0,
  activeOrders = 0,
  completedOrders = 0,
  totalSpent = 0,
  isLoading = false,
}: CustomerKPICardsProps) {
  const completionRate =
    totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  const kpis = [
    {
      id: 'kpi-total',
      label: 'Total Orders',
      value: isLoading ? '...' : String(totalOrders),
      sub: totalOrders === 0 ? 'No orders placed yet' : 'Lifetime orders',
      icon: Package,
      iconBg: 'bg-[#1A0A5E]/10',
      iconColor: 'text-[#1A0A5E]',
      trend: null,
    },
    {
      id: 'kpi-active',
      label: 'Active Orders',
      value: isLoading ? '...' : String(activeOrders),
      sub: activeOrders > 0 ? `${activeOrders} currently in progress` : 'No active orders',
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      trend: activeOrders > 0 ? 'alert' : null,
    },
    {
      id: 'kpi-completed',
      label: 'Completed Orders',
      value: isLoading ? '...' : String(completedOrders),
      sub: totalOrders > 0 ? `${completionRate}% fulfillment rate` : 'None completed yet',
      icon: CheckCircle2,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: completedOrders > 0 ? 'positive' : null,
    },
    {
      id: 'kpi-spent',
      label: 'Total Spent',
      value: isLoading ? '...' : `₦${totalSpent.toLocaleString()}`,
      sub: 'All paid services',
      icon: TrendingUp,
      iconBg: 'bg-[#CC0000]/10',
      iconColor: 'text-[#CC0000]',
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            className={`bg-white rounded-2xl p-5 border shadow-card hover:shadow-card-hover transition-all duration-300 ${
              kpi.trend === 'alert' ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl ${kpi.iconBg} flex items-center justify-center`}
              >
                <Icon size={18} className={kpi.iconColor} />
              </div>
              {kpi.trend === 'positive' && (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              )}
              {kpi.trend === 'alert' && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                  Live
                </span>
              )}
            </div>
            <div className="text-2xl font-extrabold text-[#1A0A5E] font-mono-nums mb-1">
              {kpi.value}
            </div>
            <div className="text-xs font-semibold text-gray-500 mb-0.5">{kpi.label}</div>
            <div className="text-[11px] text-gray-400">{kpi.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
