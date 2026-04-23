'use client';
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const SERVICE_DATA = [
  { service: 'Laundry', orders: 312, revenue: 1248000 },
  { service: 'Home Clean', orders: 87, revenue: 1044000 },
  { service: 'Office Clean', orders: 34, revenue: 816000 },
  { service: 'Fumigation', orders: 61, revenue: 671000 },
];

const COLORS = ['#1A0A5E', '#F5C200', '#CC0000', '#059669'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3">
      <p className="text-xs font-bold text-gray-600 mb-1.5">{label}</p>
      <p className="text-sm font-extrabold text-[#1A0A5E] font-mono-nums">{payload[0]?.value} orders</p>
    </div>
  );
}

export default function ServiceBreakdownChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-[#1A0A5E]">Orders by Service Type</h3>
        <p className="text-xs text-gray-400 mt-0.5">All-time order distribution</p>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={SERVICE_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="service"
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
            {SERVICE_DATA.map((entry, index) => (
              <Cell key={`cell-service-${entry.service.toLowerCase().replace(/\s/g, '-')}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {SERVICE_DATA.map((item, i) => (
          <div key={`legend-${item.service.toLowerCase().replace(/\s/g, '-')}`} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i] }} />
            <span className="text-xs text-gray-500 truncate">{item.service}</span>
            <span className="text-xs font-bold text-gray-700 ml-auto font-mono-nums">{item.orders}</span>
          </div>
        ))}
      </div>
    </div>
  );
}