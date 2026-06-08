'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StatusBadge, { OrderStatus } from '@/components/ui/StatusBadge';
import ServiceBadge, { ServiceType } from '@/components/ui/ServiceBadge';
import { Eye, RotateCcw, Download, ChevronRight, Loader } from 'lucide-react';
import { toast } from 'sonner';

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

export default function RecentOrdersTable() {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        const result = await response.json();
        
        // Extract orders array from response
        const ordersArray = result.orders || [];
        
        const formattedOrders = ordersArray.slice(0, 5).map((order: any) => ({
          id: order.id,
          orderNumber: `ORD-${order.id.slice(0, 6).toUpperCase()}`,
          service: (order.serviceType?.toLowerCase() || 'laundry') as ServiceType,
          items: order.items?.map((i: any) => `${i.itemName} ×${i.quantity}`).join(', ') || 'N/A',
          amount: `₦${(order.totalAmount || 0).toLocaleString()}`,
          date: new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          status: (order.status?.toLowerCase() || 'pending') as OrderStatus,
          paymentStatus: (order.paymentStatus?.toLowerCase() || 'unpaid') as OrderStatus,
        }));
        
        setOrders(formattedOrders);
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1A0A5E]">Recent Orders</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {isLoading ? 'Loading...' : `Your last ${orders.length} orders`}
          </p>
        </div>
        <Link
          href="/customer/orders"
          className="text-xs font-bold text-[#CC0000] hover:text-[#AA0000] flex items-center gap-1 transition-colors"
        >
          View All
          <ChevronRight size={13} />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-[#1A0A5E]" size={24} />
        </div>
      ) : orders.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-gray-500">No orders yet. Create your first order!</p>
          <Link href="/customer/new-order" className="text-[#CC0000] font-semibold mt-2 inline-block">
            Place Order
          </Link>
        </div>
      ) : (
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
              {orders.map((order) => (
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
                      <Link
                        href={`/customer/orders/${order.id}`}
                        className="p-1.5 rounded-lg hover:bg-[#1A0A5E]/10 text-[#1A0A5E] transition-colors"
                        title="View order details"
                      >
                        <Eye size={14} />
                      </Link>
                      {(order.status === 'delivered' || order.status === 'completed') && (
                        <button
                          className="p-1.5 rounded-lg hover:bg-[#F5C200]/20 text-[#F5C200] transition-colors"
                          title="Reorder this service"
                        >
                          <RotateCcw size={14} />
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