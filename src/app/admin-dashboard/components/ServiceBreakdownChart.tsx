'use client';
import React, { useEffect, useState } from 'react';
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
import { Loader } from 'lucide-react';

type ServiceDatum = { service: string; orders: number; revenue: number };

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
      <p className="text-sm font-extrabold text-[#1A0A5E] font-mono-nums">
        {payload[0]?.value} orders
      </p>
    </div>
  );
}

export default function ServiceBreakdownChart() {
  const [data, setData] = useState<ServiceDatum[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load stats');
        return r.json();
      })
      .then((d) => setData(d.serviceDistribution ?? []))
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-[#1A0A5E]">Orders by Service Type</h3>
        <p className="text-xs text-gray-400 mt-0.5">All-time order distribution</p>
      </div>

      {!data ? (
        failed ? (
          <p className="py-12 text-center text-sm text-gray-400">
            Service data could not be loaded. Refresh the page to retry.
          </p>
        ) : (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-[#1A0A5E]" size={24} />
          </div>
        )
      ) : data.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">
          No orders yet — the breakdown will appear as orders come in.
        </p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={data}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              barSize={32}
            >
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
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-service-${entry.service.toLowerCase().replace(/\s/g, '-')}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {data.map((item, i) => (
              <div
                key={`legend-${item.service.toLowerCase().replace(/\s/g, '-')}`}
                className="flex items-center gap-2"
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-gray-500 truncate">{item.service}</span>
                <span className="text-xs font-bold text-gray-700 ml-auto font-mono-nums">
                  {item.orders}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
