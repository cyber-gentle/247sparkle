'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  serviceType: string;
  status: string;
  totalAmount: number;
  pickupAddress: string;
  deliveryAddress: string;
  scheduledDate: string;
  customer: {
    fullName: string;
    phone: string;
    email: string;
  };
  items: Array<{ id: string; itemName: string; quantity: number }>;
}

interface RiderJobPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function RiderJobPage({ params: paramPromise }: RiderJobPageProps) {
  const router = useRouter();
  const [params, setParams] = useState<{ id: string } | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Handle async params
  useEffect(() => {
    paramPromise.then(setParams);
  }, [paramPromise]);

  useEffect(() => {
    if (!params?.id) return;

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders?orderId=${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch order');
        const data = await response.json();
        const foundOrder = data.orders?.[0];
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          toast.error('Order not found');
        }
      } catch (error: any) {
        toast.error('Failed to load order details');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [params?.id]);

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

      setOrder((prev) =>
        prev ? { ...prev, status: newStatus } : null
      );
      toast.success(`Order marked as ${newStatus}`);
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
      case 'IN_TRANSIT':
        return 'bg-yellow-100 text-yellow-800';
      case 'ARRIVED':
        return 'bg-purple-100 text-purple-800';
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

  const statusProgression = ['RIDER_ASSIGNED', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED'];
  const currentStatusIndex = statusProgression.indexOf(order.status);

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

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">ORD-{order.id.slice(0, 6).toUpperCase()}</h1>
                <p className="text-blue-100 mt-1">{order.serviceType.replace(/_/g, ' ')}</p>
              </div>
              <span className={`px-3 py-1 rounded-full font-semibold text-sm ${getStatusBadgeColor(order.status)}`}>
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Status Progression */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Delivery Progress</h3>
            <div className="flex items-center justify-between">
              {statusProgression.map((status, index) => (
                <div key={status} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      index <= currentStatusIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {index < currentStatusIndex ? (
                      <CheckCircle size={20} />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-current" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    {status.replace(/_/g, ' ')}
                  </p>
                </div>
              ))}
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
                <a
                  href={`tel:${order.customer.phone}`}
                  className="text-blue-600 hover:underline"
                >
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
            <h3 className="font-semibold text-gray-900 mb-4">Delivery Locations</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-blue-600" />
                  <p className="text-sm font-semibold text-gray-700">Pickup Location</p>
                </div>
                <p className="text-gray-600 ml-6">{order.pickupAddress}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-green-600" />
                  <p className="text-sm font-semibold text-gray-700">Delivery Location</p>
                </div>
                <p className="text-gray-600 ml-6">{order.deliveryAddress}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <div className="px-6 py-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Items</h3>
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

          {/* Total & Actions */}
          <div className="px-6 py-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700 font-semibold">Total Amount</span>
              <span className="text-2xl font-bold text-blue-600">₦{order.totalAmount.toLocaleString()}</span>
            </div>

            {/* Status Update Buttons */}
            {currentStatusIndex < statusProgression.length - 1 && (
              <div className="grid gap-2">
                <p className="text-sm font-semibold text-gray-700">Next Action:</p>
                <button
                  onClick={() =>
                    handleStatusUpdate(
                      statusProgression[Math.min(currentStatusIndex + 1, statusProgression.length - 1)]
                    )
                  }
                  disabled={updatingStatus !== null}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {updatingStatus ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Mark as {statusProgression[Math.min(currentStatusIndex + 1, statusProgression.length - 1)].replace(/_/g, ' ')}
                    </>
                  )}
                </button>
              </div>
            )}

            {currentStatusIndex === statusProgression.length - 1 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <CheckCircle className="mx-auto text-green-600 mb-2" size={24} />
                <p className="text-green-800 font-semibold">Delivery Completed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

