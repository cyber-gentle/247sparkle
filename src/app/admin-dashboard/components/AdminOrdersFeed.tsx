'use client';
import React, { useEffect, useState } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import ServiceBadge from '@/components/ui/ServiceBadge';
import { Eye, UserPlus, RefreshCw, ChevronRight, Loader } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

type Order = {
  id: string;
  serviceType: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  customer: { user: { fullName: string } } | null;
  rider: { user: { fullName: string } } | null;
};

export default function AdminOrdersFeed() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setOrders(data.recentOrders ?? []);
    } catch {
      toast.error('Failed to load orders feed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1A0A5E]">Live Orders Feed</h3>
          <p className="text-xs text-gray-400 mt-0.5">Most recent 10 orders</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live
          </div>
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Refresh">
            <RefreshCw size={14} />
          </button>
          <Link href="/admin/orders" className="text-xs font-bold text-[#CC0000] hover:text-[#AA0000] flex items-center gap-1 transition-colors">
            View All <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-[#1A0A5E]" size={22} />
        </div>
      ) : orders.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Order</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Service</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Rider</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onMouseEnter={() => setHoveredRow(order.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`border-b border-gray-50 transition-colors ${
                    order.paymentStatus === 'FAILED' ? 'bg-red-50/30' : hoveredRow === order.id ? 'bg-gray-50/80' : 'bg-white'
                  }`}
                >
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold text-[#1A0A5E] font-mono-nums">
                      ORD-{order.id.slice(0, 6).toUpperCase()}
                    </span>
                    {order.paymentStatus === 'FAILED' && (
                      <span className="ml-1.5 text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">PAY FAILED</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-gray-700">
                      {order.customer?.user?.fullName ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ServiceBadge service={order.serviceType.toLowerCase() as any} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-[#1A0A5E] font-mono-nums">
                      ₦{order.totalAmount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status.toLowerCase() as any} size="sm" />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {order.rider ? (
                      <span className="text-xs text-gray-600 font-medium">{order.rider.user.fullName}</span>
                    ) : (
                      <span className="text-xs text-gray-300 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className={`flex items-center justify-end gap-1 transition-opacity ${hoveredRow === order.id ? 'opacity-100' : 'opacity-0'}`}>
                      <Link href={`/admin/orders`} className="p-1.5 rounded-lg hover:bg-[#1A0A5E]/10 text-[#1A0A5E] transition-colors" title="View order">
                        <Eye size={13} />
                      </Link>
                      {!order.rider && order.serviceType === 'LAUNDRY' && (
                        <button
                          onClick={() => toast.info(`Assign rider to ORD-${order.id.slice(0, 6).toUpperCase()}`)}
                          className="p-1.5 rounded-lg hover:bg-[#F5C200]/20 text-[#D4A800] transition-colors"
                          title="Assign rider"
                        >
                          <UserPlus size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
