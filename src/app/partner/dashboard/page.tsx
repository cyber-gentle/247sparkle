'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  ShieldAlert,
  CheckCircle,
  User,
  ArrowRight,
  Power,
  Loader,
  LogOut,
  Package,
  CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';

interface PartnerProfile {
  id: string;
  businessName: string;
  ownerName: string;
  approvalStatus: string;
  workloadStatus: string;
}

interface PartnerOrder {
  id: string;
  status: string;
  serviceType: string;
  totalAmount: number;
  createdAt: string;
  canMarkReady: boolean;
  customer: { name: string; phone: string };
  rider: { name: string; phone: string } | null;
  itemCount: number;
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  RIDER_ASSIGNED: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-indigo-100 text-indigo-700',
  IN_CLEANING: 'bg-purple-100 text-purple-700',
  OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingWorkload, setIsTogglingWorkload] = useState(false);
  const [activeOrders, setActiveOrders] = useState<PartnerOrder[]>([]);
  const [orderHistory, setOrderHistory] = useState<PartnerOrder[]>([]);
  const [revenueThisMonth, setRevenueThisMonth] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchOrders();
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/partner/login');
  }

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/partner/profile', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/partner/login');
          return;
        }
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      setPartner(data.partner);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/partner/orders', { credentials: 'include' });
      if (response.status === 401) {
        router.push('/partner/login');
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setActiveOrders(data.activeOrders ?? []);
      setOrderHistory(data.orderHistory ?? []);
      setRevenueThisMonth(data.revenueThisMonth ?? 0);
    } catch {
      toast.error('Failed to load incoming orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const markReady = async (orderId: string) => {
    setBusyOrderId(orderId);
    try {
      const response = await fetch(`/api/partner/orders/${orderId}/ready`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? 'Failed to mark order ready');
        return;
      }
      toast.success('Order marked ready for pickup');
      fetchOrders();
    } catch {
      toast.error('Network error');
    } finally {
      setBusyOrderId('');
    }
  };

  const toggleWorkload = async () => {
    if (!partner || partner.approvalStatus !== 'APPROVED') return;
    setIsTogglingWorkload(true);
    try {
      const newStatus = partner.workloadStatus === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
      const response = await fetch('/api/partner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          businessName: partner.businessName,
          ownerName: partner.ownerName,
          address: '',
          workloadStatus: newStatus,
        }),
      });
      if (!response.ok) throw new Error('Failed to update workload');
      setPartner({ ...partner, workloadStatus: newStatus });
      toast.success(`Status set to ${newStatus === 'AVAILABLE' ? 'Available' : 'Busy'}`);
    } catch {
      toast.error('Failed to update workload status');
    } finally {
      setIsTogglingWorkload(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="inline-block animate-spin text-[#1A0A5E]" size={32} />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  const isApproved = partner?.approvalStatus === 'APPROVED';
  const isSuspended = partner?.approvalStatus === 'SUSPENDED';

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <AppLogo size={32} src="/images/logo.jpeg" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#1A0A5E]">
              {partner?.businessName ?? 'Partner Dashboard'}
            </h1>
            <p className="text-xs text-gray-500">{partner?.ownerName}</p>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              isApproved
                ? 'bg-green-100 text-green-700'
                : isSuspended
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
            }`}
          >
            {partner?.approvalStatus ?? 'PENDING'}
          </span>
          <Link
            href="/partner/profile"
            className="text-sm font-semibold text-[#1A0A5E] hover:underline flex items-center gap-1"
          >
            <User size={16} /> Profile
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-red-600 hover:underline flex items-center gap-1"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Approval banners */}
        {!isApproved && !isSuspended && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-4">
            <Clock size={22} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Account Pending Approval</p>
              <p className="text-sm text-amber-800 mt-1">
                Your partner application is under review. Once approved by an admin, you&apos;ll be
                able to update your business profile, bank details, and start receiving orders.
              </p>
            </div>
          </div>
        )}

        {isSuspended && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-4">
            <ShieldAlert size={22} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Account Suspended</p>
              <p className="text-sm text-red-800 mt-1">
                Your account has been suspended. Contact{' '}
                <a href="mailto:info.247sparkle@gmail.com" className="underline">
                  info.247sparkle@gmail.com
                </a>{' '}
                for assistance.
              </p>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 flex items-start gap-4">
            <CheckCircle size={22} className="text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-green-900">Account Approved</p>
              <p className="text-sm text-green-800 mt-1">
                Your account is active. Keep your profile and bank details up to date to receive
                payouts.
              </p>
            </div>
          </div>
        )}

        {/* Workload toggle */}
        <div
          className={`bg-white rounded-2xl border p-6 shadow-sm ${!isApproved ? 'opacity-60 border-gray-100' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1A0A5E] flex items-center gap-2">
                <Power size={20} />
                Workload Status
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {!isApproved
                  ? 'Available after account approval'
                  : partner?.workloadStatus === 'AVAILABLE'
                    ? 'You are accepting new orders'
                    : 'You are not accepting new orders'}
              </p>
            </div>
            <button
              onClick={toggleWorkload}
              disabled={isTogglingWorkload || !isApproved}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition ${
                partner?.workloadStatus === 'AVAILABLE' && isApproved
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              } disabled:cursor-not-allowed`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                  partner?.workloadStatus === 'AVAILABLE' && isApproved
                    ? 'translate-x-9'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/partner/profile"
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition flex items-center justify-between group"
          >
            <div>
              <p className="font-bold text-[#1A0A5E]">Business Profile</p>
              <p className="text-sm text-gray-500 mt-1">
                {isApproved ? 'Update details & bank info' : 'View your submitted details'}
              </p>
            </div>
            <ArrowRight size={20} className="text-gray-400 group-hover:text-[#1A0A5E] transition" />
          </Link>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <p className="font-bold text-[#1A0A5E]">Revenue This Month</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ₦{revenueThisMonth.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-gray-500 mt-1">Paid orders routed to your shop</p>
          </div>
        </div>

        {/* Incoming orders */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-6 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-[#1A0A5E] flex items-center gap-2">
              <Package size={20} />
              Incoming Orders
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {!isApproved
                ? 'Available after approval'
                : activeOrders.length > 0
                  ? `${activeOrders.length} order${activeOrders.length === 1 ? '' : 's'} at your shop`
                  : 'No orders assigned yet'}
            </p>
          </div>

          <div className="p-6">
            {ordersLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader className="animate-spin" size={24} />
              </div>
            ) : !isApproved ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Orders assigned by admins will appear here once your account is approved.
              </p>
            ) : activeOrders.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No active orders. New pickups routed to your shop will appear here.
              </p>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {order.customer.name} · {order.itemCount} item
                          {order.itemCount === 1 ? '' : 's'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          #{order.id.slice(-8)} · {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                          ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                      <span>
                        Customer:{' '}
                        <a
                          href={`tel:${order.customer.phone}`}
                          className="text-[#1A0A5E] font-medium"
                        >
                          {order.customer.phone || '—'}
                        </a>
                      </span>
                      {order.rider && (
                        <span>
                          Rider:{' '}
                          <a
                            href={`tel:${order.rider.phone}`}
                            className="text-[#1A0A5E] font-medium"
                          >
                            {order.rider.name}
                          </a>
                        </span>
                      )}
                      <span>₦{order.totalAmount.toLocaleString('en-NG')}</span>
                    </div>

                    {order.canMarkReady && (
                      <button
                        onClick={() => markReady(order.id)}
                        disabled={busyOrderId === order.id}
                        className="self-start inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition disabled:opacity-60"
                      >
                        {busyOrderId === order.id ? (
                          <Loader size={16} className="animate-spin" />
                        ) : (
                          <CheckCheck size={16} />
                        )}
                        Mark Ready for Pickup
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order history */}
        {orderHistory.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#1A0A5E]">Order History</h2>
            </div>
            <div className="p-6 pt-4 space-y-3">
              {orderHistory.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      #{order.id.slice(-8)} · {order.customer.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()} · ₦
                      {order.totalAmount.toLocaleString('en-NG')}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                      ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
