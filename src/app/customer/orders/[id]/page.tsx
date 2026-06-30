'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Calendar, MapPin, Phone, Mail, CheckCircle2, Clock, Truck, Sparkles, Home, Building2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';

interface OrderDetails {
  id: string;
  serviceType: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  items?: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    isWhiteGroup: boolean;
  }>;
  rider?: {
    id: string;
    phone?: string;
    fullName?: string;
  };
  certificate?: {
    certificateNumber: string;
    issuedAt: string;
  };
}

export default function CustomerOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    params.then(p => {
      setOrderId(p.id);
      fetchOrderDetails(p.id);
    });
  }, [params]);

  const fetchOrderDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/customer/login');
          return;
        }
        if (response.status === 404) {
          toast.error('Order not found');
          router.push('/customer/orders');
          return;
        }
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceIcon = (type: string) => {
    const icons: Record<string, any> = {
      LAUNDRY: Package,
      HOME_CLEANING: Home,
      OFFICE_CLEANING: Building2,
      FUMIGATION: Shield,
    };
    return icons[type] || Package;
  };

  const getServiceLabel = (type: string) => {
    const labels: Record<string, string> = {
      LAUNDRY: 'Laundry Service',
      HOME_CLEANING: 'Home Cleaning',
      OFFICE_CLEANING: 'Office Cleaning',
      FUMIGATION: 'Fumigation Service',
    };
    return labels[type] || type;
  };

  const getStatusSteps = (status: string, serviceType: string) => {
    if (serviceType === 'FUMIGATION') {
      return [
        { key: 'PENDING', label: 'Order Placed', icon: CheckCircle2 },
        { key: 'SCHEDULED', label: 'Scheduled', icon: Calendar },
        { key: 'IN_PROGRESS', label: 'In Progress', icon: Clock },
        { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
      ];
    }

    return [
      { key: 'PENDING', label: 'Order Placed', icon: CheckCircle2 },
      { key: 'RIDER_ASSIGNED', label: 'Rider Assigned', icon: Truck },
      { key: 'PICKED_UP', label: 'Picked Up', icon: Package },
      { key: 'IN_CLEANING', label: 'In Cleaning', icon: Sparkles },
      { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
      { key: 'COMPLETED', label: 'Delivered', icon: CheckCircle2 },
    ];
  };

  const getCurrentStepIndex = (status: string, steps: any[]) => {
    const index = steps.findIndex(step => step.key === status);
    return index === -1 ? 0 : index;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A0A5E]"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  const ServiceIcon = getServiceIcon(order.serviceType);
  const steps = getStatusSteps(order.status, order.serviceType);
  const currentStep = getCurrentStepIndex(order.status, steps);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#F5C200]/10">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/customer/orders" className="text-gray-600 hover:text-[#1A0A5E]">
              <ArrowLeft size={20} />
            </Link>
            <AppLogo size={32} src="/images/logo.jpeg" />
            <h1 className="text-xl font-bold text-[#1A0A5E]">Order Details</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Order Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-[#1A0A5E] flex items-center justify-center">
                <ServiceIcon size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1A0A5E]">{getServiceLabel(order.serviceType)}</h2>
                <p className="text-sm text-gray-500">Order #{order.id.slice(-8)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#1A0A5E]">₦{order.totalAmount.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1">
                {order.paymentStatus === 'PAID' ? (
                  <span className="text-green-600 font-semibold">✓ Paid</span>
                ) : (
                  <span className="text-yellow-600 font-semibold">⏳ {order.paymentStatus}</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <Calendar size={14} className="inline mr-2" />
            Placed on {formatDate(order.createdAt)}
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#1A0A5E] mb-6">Order Status</h3>
          <div className="relative">
            <div className="flex justify-between items-start">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}
                    >
                      <Icon size={20} />
                    </div>
                    <p
                      className={`text-xs font-semibold mt-2 text-center ${
                        isCompleted ? 'text-[#1A0A5E]' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    {index < steps.length - 1 && (
                      <div
                        className={`absolute h-0.5 ${
                          index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        style={{
                          top: '24px',
                          left: `${(index + 0.5) * (100 / steps.length)}%`,
                          width: `${100 / steps.length}%`,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#1A0A5E] mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="font-semibold text-[#1A0A5E]">
                      {item.itemName}
                      {item.isWhiteGroup && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">White</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity} × ₦{item.unitPrice.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#1A0A5E]">₦{item.subtotal.toLocaleString()}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200">
                <p className="text-lg font-bold text-[#1A0A5E]">Total</p>
                <p className="text-2xl font-bold text-[#1A0A5E]">₦{order.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Information */}
        {(order.pickupAddress || order.deliveryAddress) && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#1A0A5E] mb-4">Delivery Information</h3>
            <div className="space-y-4">
              {order.pickupAddress && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                    <MapPin size={16} className="text-[#1A0A5E]" />
                    Pickup Address
                  </div>
                  <p className="text-gray-600 ml-6">{order.pickupAddress}</p>
                </div>
              )}
              {order.deliveryAddress && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                    <MapPin size={16} className="text-[#1A0A5E]" />
                    Delivery Address
                  </div>
                  <p className="text-gray-600 ml-6">{order.deliveryAddress}</p>
                </div>
              )}
              {order.scheduledDate && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                    <Calendar size={16} className="text-[#1A0A5E]" />
                    Scheduled Date
                  </div>
                  <p className="text-gray-600 ml-6">
                    {formatDate(order.scheduledDate)}
                    {order.scheduledTime && ` at ${order.scheduledTime}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Certificate */}
        {order.certificate && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-8 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Shield size={24} className="text-green-600" />
              <h3 className="text-lg font-bold text-green-900">Fumigation Certificate Issued</h3>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              Certificate Number: <span className="font-bold">{order.certificate.certificateNumber}</span>
            </p>
            <p className="text-sm text-gray-700 mb-4">
              Issued on: {formatDate(order.certificate.issuedAt)}
            </p>
            <Link
              href={`/verify?number=${order.certificate.certificateNumber}`}
              className="inline-block rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Verify Certificate
            </Link>
          </div>
        )}

        {/* Rider Information */}
        {order.rider && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-[#1A0A5E] mb-4">Rider Information</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1A0A5E] flex items-center justify-center text-white font-bold">
                {order.rider.fullName?.[0] || 'R'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#1A0A5E]">{order.rider.fullName || 'Assigned Rider'}</p>
                {order.rider.phone && (
                  <p className="text-sm text-gray-600">
                    <Phone size={12} className="inline mr-1" />
                    {order.rider.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
