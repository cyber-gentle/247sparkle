'use client';
import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Loader } from 'lucide-react';

type RevenuePoint = { day: string; revenue: number; orders: number };

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 min-w-[140px]">
      <p className="text-xs font-bold text-gray-500 mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500">Revenue</span>
          <span className="text-sm font-extrabold text-[#1A0A5E] font-mono-nums">
            ₦{payload[0]?.value?.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500">Orders</span>
          <span className="text-sm font-bold text-[#F5C200] font-mono-nums">
            {payload[1]?.value}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RevenueChart() {
  const [data, setData] = useState<RevenuePoint[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load stats');
        return r.json();
      })
      .then((d) => setData(d.revenueSeries ?? []))
      .catch(() => setFailed(true));
  }, []);

  const hasRevenue = (data ?? []).some((p) => p.revenue > 0 || p.orders > 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-[#1A0A5E]">Revenue & Orders — Last 14 Days</h3>
          <p className="text-xs text-gray-400 mt-0.5">Daily platform revenue in ₦ Naira</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#1A0A5E]" />
            <span className="text-gray-500 font-medium">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#F5C200]" />
            <span className="text-gray-500 font-medium">Orders</span>
          </div>
        </div>
      </div>

      {!data ? (
        failed ? (
          <p className="py-16 text-center text-sm text-gray-400">
            Revenue data could not be loaded. Refresh the page to retry.
          </p>
        ) : (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-[#1A0A5E]" size={24} />
          </div>
        )
      ) : !hasRevenue ? (
        <p className="py-16 text-center text-sm text-gray-400">
          No orders in the last 14 days yet — revenue will appear here as orders come in.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1A0A5E" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#1A0A5E" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F5C200" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#F5C200" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }}
            axisLine={false}
            tickLine={false}
            interval={1}
          />
          <YAxis
            yAxisId="revenue"
            tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
            width={48}
          />
          <YAxis
            yAxisId="orders"
            orientation="right"
            tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="#1A0A5E"
            strokeWidth={2.5}
            fill="url(#gradRevenue)"
            dot={false}
            activeDot={{ r: 5, fill: '#1A0A5E', strokeWidth: 0 }}
          />
          <Area
            yAxisId="orders"
            type="monotone"
            dataKey="orders"
            stroke="#F5C200"
            strokeWidth={2}
            fill="url(#gradOrders)"
            dot={false}
            activeDot={{ r: 4, fill: '#F5C200', strokeWidth: 0 }}
          />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
