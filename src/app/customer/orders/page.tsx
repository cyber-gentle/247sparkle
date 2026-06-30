'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Calendar, MapPin, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';

interface Order {
  id: string;
  serviceType: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  scheduledDate?: string;
  items?: any[];
}

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter, serviceFilter]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/customer/login');
          return;
        }
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.pickupAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.deliveryAddress?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Service filter
    if (serviceFilter !== 'ALL') {
      filtered = filtered.filter(order => order.serviceType === serviceFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      RIDER_ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
      PICKED_UP: 'bg-purple-100 text-purple-800 border-purple-200',
      IN_CLEANING: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentColor = (status: string) => {
    const colors: Record<string, string> = {
      PAID: 'bg-green-100 text-green-800',
      UNPAID: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getServiceLabel = (type: string) => {
    const labels: Record<string, string> = {
      LAUNDRY: 'Laundry',
      HOME_CLEANING: 'Home Cleaning',
      OFFICE_CLEANING: 'Office Cleaning',
      FUMIGATION: 'Fumigation',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#F5C200]/10">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/customer-dashboard" className="text-gray-600 hover:text-[#1A0A5E]">
              <ArrowLeft size={20} />
            </Link>
            <AppLogo size={32} src="/images/logo.jpeg" />
            <h1 className="text-xl font-bold text-[#1A0A5E]">My Orders</h1>
          </div>
          <Link
            href="/customer/new-order"
            className="rounded-xl bg-[#1A0A5E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#120843]"
          >
            + New Order
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:border-transparent"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="RIDER_ASSIGNED">Rider Assigned</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_CLEANING">In Cleaning</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Service Filter */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:border-transparent"
            >
              <option value="ALL">All Services</option>
              <option value="LAUNDRY">Laundry</option>
              <option value="HOME_CLEANING">Home Cleaning</option>
              <option value="OFFICE_CLEANING">Office Cleaning</option>
              <option value="FUMIGATION">Fumigation</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A0A5E]"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {orders.length === 0
                ? 'Start by placing your first order'
                : 'Try adjusting your search or filters'}
            </p>
            {orders.length === 0 && (
              <Link
                href="/customer/new-order"
                className="inline-block rounded-xl bg-[#1A0A5E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#120843]"
              >
                Place Your First Order
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Link
                key={order.id}
                href={`/customer/orders/${order.id}`}
                className="block bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-[#1A0A5E]">
                        {getServiceLabel(order.serviceType)}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      {order.pickupAddress && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="truncate">{order.pickupAddress}</span>
                        </div>
                      )}
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="mt-3 text-sm text-gray-600">
                        <span className="font-semibold">Items: </span>
                        {order.items.map((item: any) => `${item.quantity}x ${item.itemName}`).join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#1A0A5E]">
                      ₦{order.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Order ID: {order.id.slice(-8)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
