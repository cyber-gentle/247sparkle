'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  Loader,
  AlertCircle,
  Building2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatOrderNumber } from '@/lib/order-utils';

interface Order {
  id: string;
  serviceType: string;
  status: string;
  taskFee?: number;
  pickupAddress: string;
  deliveryAddress: string;
  scheduledDate: string;
  customer: {
    fullName: string;
    phone: string;
    email: string;
  };
  partner?: {
    id: string;
    businessName: string;
    address?: string;
    phone?: string;
  } | null;
  items: Array<{ id: string; itemName: string; quantity: number }>;
}

interface RiderJobPageProps {
  params: Promise<{
    id: string;
  }>;
}

const STATUS_STEPS = [
  { key: 'RIDER_ASSIGNED', label: 'Assigned' },
  { key: 'PICKED_UP', label: 'Picked Up' },
  { key: 'IN_CLEANING', label: 'At Partner' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'COMPLETED', label: 'Delivered' },
] as const;

export default function RiderJobPage({ params: paramPromise }: RiderJobPageProps) {
  const [params, setParams] = useState<{ id: string } | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle async params
  useEffect(() => {
    paramPromise.then(setParams);
  }, [paramPromise]);

  // Feed the rider's GPS position while a job page is open, so the customer's
  // tracking map follows the rider between pickup and delivery.
  useEffect(() => {
    if (!order || order.status === 'COMPLETED' || order.status === 'CANCELLED') return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const postPosition = (position: GeolocationPosition) => {
      fetch('/api/riders/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      }).catch(() => {
        /* keep watching even if a single update fails */
      });
    };

    const watchId = navigator.geolocation.watchPosition(postPosition, () => {}, {
      enableHighAccuracy: false,
      maximumAge: 10_000,
      timeout: 20_000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [order?.status, order?.id]);

  const fetchOrder = useCallback(
    async (silent = false) => {
      if (!params?.id) return;
      if (!silent) setIsRefreshing(true);

      try {
        const response = await fetch(`/api/orders/${params.id}`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch order');
        }
        const data = await response.json();
        if (data.order) {
          setOrder(data.order);
        } else if (!silent) {
          toast.error('Order not found');
        }
      } catch (error: any) {
        if (!silent) {
          toast.error(error.message || 'Failed to load order details');
        }
        console.error(error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [params?.id]
  );

  useEffect(() => {
    if (params?.id) {
      fetchOrder(false);
    }
  }, [params?.id, fetchOrder]);

  // Auto-poll status when:
  // 1. Order is IN_CLEANING: poll until partner finishes cleaning and marks ready.
  // 2. Order is PICKED_UP without a partner: poll until admin assigns a partner shop.
  useEffect(() => {
    if (!order || order.status === 'COMPLETED' || order.status === 'CANCELLED') return;
    const shouldPoll =
      order.status === 'IN_CLEANING' || (order.status === 'PICKED_UP' && !order.partner);

    if (!shouldPoll) return;

    const interval = setInterval(() => {
      fetchOrder(true);
    }, 10_000);

    return () => clearInterval(interval);
  }, [order?.status, order?.partner, fetchOrder]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!params?.id) return;

    setUpdatingStatus(newStatus);
    try {
      const response = await fetch(`/api/orders/${params.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to update status');
        return;
      }

      setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      toast.success(
        newStatus === 'IN_CLEANING'
          ? 'Order delivered to partner shop!'
          : newStatus === 'COMPLETED'
            ? 'Order marked as completed!'
            : `Order marked as ${newStatus.replace(/_/g, ' ').toLowerCase()}`
      );
    } catch (error: any) {
      toast.error('Error updating order status');
      console.error(error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'RIDER_ASSIGNED':
        return 'bg-blue-100 text-blue-800';
      case 'PICKED_UP':
        return 'bg-amber-100 text-amber-800';
      case 'IN_CLEANING':
        return 'bg-purple-100 text-purple-800';
      case 'OUT_FOR_DELIVERY':
        return 'bg-cyan-100 text-cyan-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto flex justify-center items-center h-64">
          <Loader className="animate-spin text-blue-600" size={32} />
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/rider/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft size={18} />
            Back to Jobs
          </Link>
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-600">Order not found</p>
          </div>
        </div>
      </main>
    );
  }

  const currentStatusIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/rider/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={18} />
            Back to Jobs
          </Link>
          <button
            onClick={() => fetchOrder(false)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{formatOrderNumber(order.id)}</h1>
                <p className="text-blue-100 mt-1">{order.serviceType.replace(/_/g, ' ')}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full font-semibold text-sm ${getStatusBadgeColor(order.status)}`}
              >
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Status Progression */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Fulfillment Progress</h3>
            <div className="flex items-center justify-between">
              {STATUS_STEPS.map((step, index) => {
                const isPassed = currentStatusIndex > index;
                const isCurrent = currentStatusIndex === index;
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                        isPassed
                          ? 'bg-blue-600 text-white'
                          : isCurrent
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                            : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle size={18} />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                    <p
                      className={`text-xs text-center ${isCurrent ? 'font-semibold text-blue-700' : 'text-gray-500'}`}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Info */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold text-gray-900">{order.customer.fullName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <a href={`tel:${order.customer.phone}`} className="text-blue-600 hover:underline">
                  {order.customer.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <a
                  href={`mailto:${order.customer.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {order.customer.email}
                </a>
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Addresses</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-blue-600" />
                  <p className="text-sm font-semibold text-gray-700">Customer Pickup Address</p>
                </div>
                <p className="text-gray-600 ml-6">{order.pickupAddress}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-green-600" />
                  <p className="text-sm font-semibold text-gray-700">Customer Delivery Address</p>
                </div>
                <p className="text-gray-600 ml-6">{order.deliveryAddress}</p>
              </div>
            </div>
          </div>

          {/* Assigned Partner Shop (if assigned) */}
          {order.partner && (
            <div className="px-6 py-6 border-b border-gray-200 bg-purple-50/50">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={18} className="text-purple-600" />
                <h3 className="font-semibold text-gray-900">Assigned Laundry Partner Shop</h3>
              </div>
              <div className="space-y-2 text-sm bg-white p-4 rounded-xl border border-purple-100">
                <p className="font-bold text-gray-900 text-base">{order.partner.businessName}</p>
                {order.partner.address && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin size={15} className="text-purple-600 shrink-0 mt-0.5" />
                    <span>{order.partner.address}</span>
                  </div>
                )}
                {order.partner.phone && (
                  <div className="flex items-center gap-2 text-gray-600 pt-1">
                    <Phone size={15} className="text-purple-600 shrink-0" />
                    <a
                      href={`tel:${order.partner.phone}`}
                      className="text-purple-700 font-medium hover:underline"
                    >
                      {order.partner.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <div className="px-6 py-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Items ({order.items.length})</h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">{item.itemName}</span>
                    <span className="font-semibold text-gray-900">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task Fee & Status-Specific Actions */}
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
              <div>
                <span className="text-gray-800 font-semibold block">Delivery Task Fee</span>
                <span className="text-xs text-gray-500">Your earning upon completion</span>
              </div>
              <span className="text-2xl font-bold text-green-700">
                ₦{(order.taskFee ?? 200).toLocaleString()}
              </span>
            </div>

            {/* PHASE 1: RIDER ASSIGNED (Customer Pickup) */}
            {order.status === 'RIDER_ASSIGNED' && (
              <div className="space-y-3">
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900">
                  <p className="font-semibold flex items-center gap-1.5">
                    <MapPin size={16} className="text-blue-600" />
                    Leg 1: Pick up from Customer
                  </p>
                  <p className="text-xs mt-1 text-blue-700">
                    Go to the customer pickup address. Once the items are handed over to you,
                    confirm below.
                  </p>
                </div>
                <button
                  onClick={() => handleStatusUpdate('PICKED_UP')}
                  disabled={updatingStatus !== null}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {updatingStatus === 'PICKED_UP' ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Mark as Picked Up
                    </>
                  )}
                </button>
              </div>
            )}

            {/* PHASE 2: PICKED UP (Deliver to Partner Shop) */}
            {order.status === 'PICKED_UP' && (
              <div className="space-y-4">
                {order.partner ? (
                  <>
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-purple-900 font-semibold">
                        <Building2 size={18} className="text-purple-600" />
                        <span>Leg 2: Drop off at Partner Shop</span>
                      </div>
                      <div className="text-sm space-y-1.5 text-gray-700 bg-white p-3 rounded-lg border border-purple-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Destination Shop
                        </p>
                        <p className="font-bold text-gray-900 text-base">
                          {order.partner.businessName}
                        </p>
                        {order.partner.address && (
                          <div className="flex items-start gap-2 pt-1 text-gray-800">
                            <MapPin size={15} className="text-purple-600 shrink-0 mt-0.5" />
                            <span>{order.partner.address}</span>
                          </div>
                        )}
                        {order.partner.phone && (
                          <div className="flex items-center gap-2 pt-1">
                            <Phone size={15} className="text-purple-600 shrink-0" />
                            <a
                              href={`tel:${order.partner.phone}`}
                              className="text-purple-700 font-semibold hover:underline"
                            >
                              {order.partner.phone}
                            </a>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-purple-800">
                        Deliver the customer&apos;s laundry to the partner shop above. Once handed
                        over to the partner staff, tap below to confirm drop-off.
                      </p>
                    </div>

                    <button
                      onClick={() => handleStatusUpdate('IN_CLEANING')}
                      disabled={updatingStatus !== null}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      {updatingStatus === 'IN_CLEANING' ? (
                        <>
                          <Loader size={18} className="animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Building2 size={18} />
                          Delivered to Partner
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-900 font-semibold">
                      <AlertCircle size={18} className="text-amber-600" />
                      <span>Awaiting Partner Shop Assignment</span>
                    </div>
                    <p className="text-sm text-amber-800">
                      Admin has not yet assigned a laundry cleaning partner to this order. Please
                      keep the customer&apos;s items safe. As soon as the admin routes the order,
                      the shop name and address will appear here.
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 text-xs text-amber-800">
                      <span>Auto-checking every 10 seconds...</span>
                      <button
                        onClick={() => fetchOrder(false)}
                        className="font-bold underline hover:text-amber-900"
                      >
                        Check Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PHASE 3: IN CLEANING (Partner is Cleaning - Rider waits) */}
            {order.status === 'IN_CLEANING' && (
              <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-900">Order is Being Cleaned</h4>
                    <p className="text-xs text-purple-700">Step 3: Partner Processing</p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed">
                  The clothes were received at{' '}
                  <span className="font-semibold text-gray-900">
                    {order.partner?.businessName || 'the assigned partner shop'}
                  </span>{' '}
                  and are currently being washed.
                </p>

                <div className="p-3 bg-white rounded-lg border border-purple-100 text-xs text-gray-600 space-y-1">
                  <p className="font-semibold text-gray-800">What happens next?</p>
                  <p>
                    Once cleaning is complete, the partner shop will mark the order ready for
                    pickup. This screen will automatically update to show customer delivery
                    instructions.
                  </p>
                </div>

                {order.partner?.phone && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-100 text-sm">
                    <span className="text-gray-600">Partner shop contact:</span>
                    <a
                      href={`tel:${order.partner.phone}`}
                      className="inline-flex items-center gap-1.5 text-purple-700 font-semibold hover:underline"
                    >
                      <Phone size={14} />
                      {order.partner.phone}
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-purple-700 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    Checking for partner readiness...
                  </span>
                  <button
                    onClick={() => fetchOrder(false)}
                    className="text-purple-800 font-semibold underline hover:text-purple-900"
                  >
                    Refresh Now
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 4: OUT FOR DELIVERY (Customer Drop-off) */}
            {order.status === 'OUT_FOR_DELIVERY' && (
              <div className="space-y-4">
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-cyan-900 font-semibold">
                    <MapPin size={18} className="text-cyan-600" />
                    <span>Leg 3: Deliver to Customer</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Cleaning is complete! Collect the finished items from{' '}
                    <span className="font-semibold text-gray-900">
                      {order.partner?.businessName || 'the partner shop'}
                    </span>{' '}
                    and deliver them to the customer at:
                  </p>
                  <div className="p-3 bg-white rounded-lg border border-cyan-100 text-sm font-medium text-gray-900">
                    {order.deliveryAddress}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>
                      Customer: <strong className="text-gray-900">{order.customer.fullName}</strong>
                    </span>
                    <span>•</span>
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="text-cyan-700 font-semibold hover:underline"
                    >
                      {order.customer.phone}
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => handleStatusUpdate('COMPLETED')}
                  disabled={updatingStatus !== null}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {updatingStatus === 'COMPLETED' ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Delivered to Customer
                    </>
                  )}
                </button>
              </div>
            )}

            {/* PHASE 5: COMPLETED */}
            {order.status === 'COMPLETED' && (
              <div className="p-5 bg-green-50 border border-green-200 rounded-xl text-center space-y-2">
                <CheckCircle className="mx-auto text-green-600" size={32} />
                <p className="text-green-900 font-bold text-lg">Delivery Completed!</p>
                <p className="text-xs text-green-700">
                  You have earned ₦{(order.taskFee ?? 200).toLocaleString()} for completing this
                  job.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
