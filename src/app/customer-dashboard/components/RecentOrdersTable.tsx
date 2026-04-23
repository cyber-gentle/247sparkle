'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import StatusBadge, { OrderStatus } from '@/components/ui/StatusBadge';
import ServiceBadge, { ServiceType } from '@/components/ui/ServiceBadge';
import { Eye, RotateCcw, Download, ChevronRight } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  service: ServiceType;
  items: string;
  amount: string;
  date: string;
  status: OrderStatus;
  paymentStatus: OrderStatus;
}

const RECENT_ORDERS: Order[] = [
  {
    id: 'order-cust-047',
    orderNumber: 'ORD-2025-0047',
    service: 'laundry',
    items: '6 pieces (Jeans ×2, T-shirt ×3, Towel ×1)',
    amount: '₦4,500',
    date: '23 Apr 2026',
    status: 'out_for_delivery',
    paymentStatus: 'paid',
  },
  {
    id: 'order-cust-046',
    orderNumber: 'ORD-2025-0046',
    service: 'fumigation',
    items: '2 Rooms Apartment — Ikeja',
    amount: '₦15,000',
    date: '21 Apr 2026',
    status: 'completed',
    paymentStatus: 'paid',
  },
  {
    id: 'order-cust-044',
    orderNumber: 'ORD-2025-0044',
    service: 'laundry',
    items: '9 pieces (Agbada ×1, Lace ×2, Bedsheet ×2, Canvas ×4)',
    amount: '₦8,200',
    date: '18 Apr 2026',
    status: 'delivered',
    paymentStatus: 'paid',
  },
  {
    id: 'order-cust-041',
    orderNumber: 'ORD-2025-0041',
    service: 'home_cleaning',
    items: 'Residential Cleaning — 3 Bedroom',
    amount: '₦12,000',
    date: '14 Apr 2026',
    status: 'completed',
    paymentStatus: 'paid',
  },
  {
    id: 'order-cust-039',
    orderNumber: 'ORD-2025-0039',
    service: 'laundry',
    items: '4 pieces (Sportswear ×2, Curtains ×1, Bedsheet ×1)',
    amount: '₦3,800',
    date: '10 Apr 2026',
    status: 'delivered',
    paymentStatus: 'paid',
  },
];

export default function RecentOrdersTable() {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1A0A5E]">Recent Orders</h3>
          <p className="text-xs text-gray-400 mt-0.5">Your last 5 orders</p>
        </div>
        <Link
          href="/customer-dashboard"
          className="text-xs font-bold text-[#CC0000] hover:text-[#AA0000] flex items-center gap-1 transition-colors"
        >
          View All
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Order</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Service</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Items</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Date</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
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
                  hoveredRow === order.id ? 'bg-gray-50/80' : 'bg-white'
                }`}
              >
                <td className="px-5 py-3.5">
                  <span className="text-xs font-bold text-[#1A0A5E] font-mono-nums">{order.orderNumber}</span>
                </td>
                <td className="px-4 py-3.5">
                  <ServiceBadge service={order.service} />
                </td>
                <td className="px-4 py-3.5 hidden md:table-cell">
                  <span className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">{order.items}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm font-bold text-[#1A0A5E] font-mono-nums">{order.amount}</span>
                </td>
                <td className="px-4 py-3.5 hidden sm:table-cell">
                  <span className="text-xs text-gray-500">{order.date}</span>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={order.status} size="sm" />
                </td>
                <td className="px-5 py-3.5">
                  <div
                    className={`flex items-center justify-end gap-1 transition-opacity ${
                      hoveredRow === order.id ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <button
                      className="p-1.5 rounded-lg hover:bg-[#1A0A5E]/10 text-[#1A0A5E] transition-colors"
                      title="View order details"
                    >
                      <Eye size={14} />
                    </button>
                    {(order.status === 'delivered' || order.status === 'completed') && (
                      <button
                        className="p-1.5 rounded-lg hover:bg-[#F5C200]/20 text-[#F5C200] transition-colors"
                        title="Reorder this service"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                    {order.service === 'fumigation' && order.status === 'completed' && (
                      <button
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                        title="Download fumigation certificate"
                      >
                        <Download size={14} />
                      </button>
                    )}
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