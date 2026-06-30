'use client';
import React, { useState } from 'react';
import StatusBadge, { OrderStatus } from '@/components/ui/StatusBadge';
import ServiceBadge, { ServiceType } from '@/components/ui/ServiceBadge';
import { Eye, UserPlus, MoreHorizontal, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AdminOrder {
  id: string;
  orderNumber: string;
  customer: string;
  service: ServiceType;
  amount: string;
  status: OrderStatus;
  paymentStatus: OrderStatus;
  rider: string | null;
  time: string;
  area: string;
}

const RECENT_ORDERS: AdminOrder[] = [
  {
    id: 'admin-order-051',
    orderNumber: 'ORD-2025-0051',
    customer: 'Olumide Fashola',
    service: 'laundry',
    amount: '₦6,200',
    status: 'pending',
    paymentStatus: 'failed',
    rider: null,
    time: '10:42 AM',
    area: 'Lekki Phase 1',
  },
  {
    id: 'admin-order-050',
    orderNumber: 'ORD-2025-0050',
    customer: 'Ngozi Eze-Williams',
    service: 'fumigation',
    amount: '₦18,000',
    status: 'scheduled',
    paymentStatus: 'paid',
    rider: null,
    time: '10:15 AM',
    area: 'Ajah',
  },
  {
    id: 'admin-order-049',
    orderNumber: 'ORD-2025-0049',
    customer: 'Babatunde Adeyinka',
    service: 'laundry',
    amount: '₦4,800',
    status: 'out_for_delivery',
    paymentStatus: 'paid',
    rider: 'Tunde Kazeem',
    time: '09:58 AM',
    area: 'Yaba',
  },
  {
    id: 'admin-order-048',
    orderNumber: 'ORD-2025-0048',
    customer: 'Amaka Obi',
    service: 'home_cleaning',
    amount: '₦14,500',
    status: 'in_progress',
    paymentStatus: 'paid',
    rider: null,
    time: '09:30 AM',
    area: 'Surulere',
  },
  {
    id: 'admin-order-047',
    orderNumber: 'ORD-2025-0047',
    customer: 'Adaeze Okonkwo',
    service: 'laundry',
    amount: '₦4,500',
    status: 'out_for_delivery',
    paymentStatus: 'paid',
    rider: 'Tunde Kazeem',
    time: '09:15 AM',
    area: 'Victoria Island',
  },
  {
    id: 'admin-order-046',
    orderNumber: 'ORD-2025-0046',
    customer: 'Chukwuemeka Nwosu',
    service: 'laundry',
    amount: '₦7,800',
    status: 'in_cleaning',
    paymentStatus: 'paid',
    rider: 'Segun Afolabi',
    time: '08:50 AM',
    area: 'Ikeja GRA',
  },
  {
    id: 'admin-order-045',
    orderNumber: 'ORD-2025-0045',
    customer: 'Fatima Bello-Usman',
    service: 'office_cleaning',
    amount: '₦25,000',
    status: 'completed',
    paymentStatus: 'paid',
    rider: null,
    time: '08:00 AM',
    area: 'Marina',
  },
  {
    id: 'admin-order-044',
    orderNumber: 'ORD-2025-0044',
    customer: 'Kehinde Olatunji',
    service: 'laundry',
    amount: '₦3,400',
    status: 'rider_assigned',
    paymentStatus: 'paid',
    rider: 'Emmanuel Ojo',
    time: '07:45 AM',
    area: 'Mushin',
  },
];

export default function AdminOrdersFeed() {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleAssignRider = (orderNumber: string) => {
    // TODO: Backend — PUT /api/orders/:id/assign — assign rider to order
    toast.success(`Rider assignment modal opened for ${orderNumber}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1A0A5E]">Live Orders Feed</h3>
          <p className="text-xs text-gray-400 mt-0.5">Today — 23 Apr 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live
          </div>
          <button
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            title="Refresh orders feed"
          >
            <RefreshCw size={14} />
          </button>
          <button className="text-xs font-bold text-[#CC0000] hover:text-[#AA0000] flex items-center gap-1 transition-colors">
            View All
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Order</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Customer</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Area</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Service</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Rider</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Time</th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {RECENT_ORDERS.map((order) => (
              <tr
                key={order.id}
                onMouseEnter={() => setHoveredRow(order.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`border-b border-gray-50 transition-colors ${
                  order.paymentStatus === 'failed' ?'bg-red-50/30'
                    : hoveredRow === order.id
                    ? 'bg-gray-50/80' :'bg-white'
                }`}
              >
                <td className="px-5 py-3">
                  <span className="text-xs font-bold text-[#1A0A5E] font-mono-nums">{order.orderNumber}</span>
                  {order.paymentStatus === 'failed' && (
                    <span className="ml-1.5 text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                      PAY FAILED
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold text-gray-700">{order.customer}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-gray-500">{order.area}</span>
                </td>
                <td className="px-4 py-3">
                  <ServiceBadge service={order.service} />
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-bold text-[#1A0A5E] font-mono-nums">{order.amount}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} size="sm" />
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {order.rider ? (
                    <span className="text-xs text-gray-600 font-medium">{order.rider}</span>
                  ) : (
                    <span className="text-xs text-gray-300 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs text-gray-400 font-mono-nums">{order.time}</span>
                </td>
                <td className="px-5 py-3">
                  <div
                    className={`flex items-center justify-end gap-1 transition-opacity ${
                      hoveredRow === order.id ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <button
                      className="p-1.5 rounded-lg hover:bg-[#1A0A5E]/10 text-[#1A0A5E] transition-colors"
                      title="View full order details"
                    >
                      <Eye size={13} />
                    </button>
                    {!order.rider && order.service === 'laundry' && (
                      <button
                        onClick={() => handleAssignRider(order.orderNumber)}
                        className="p-1.5 rounded-lg hover:bg-[#F5C200]/20 text-[#D4A800] transition-colors"
                        title="Assign a rider to this order"
                      >
                        <UserPlus size={13} />
                      </button>
                    )}
                    <button
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                      title="More actions"
                    >
                      <MoreHorizontal size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}