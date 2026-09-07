'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Phone,
  ChevronDown,
  ChevronUp,
  Package,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface ActiveOrderTrackerProps {
  order?: any | null;
  isLoading?: boolean;
}

const ORDER_STAGES = [
  { key: 'PENDING', label: 'Order Placed' },
  { key: 'RIDER_ASSIGNED', label: 'Rider Assigned' },
  { key: 'PICKED_UP', label: 'Picked Up / On-Site' },
  { key: 'IN_CLEANING', label: 'Service In Progress' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'COMPLETED', label: 'Completed' },
];

function getStageIndex(status: string): number {
  switch (status) {
    case 'PENDING':
    case 'PAID_UNASSIGNED':
      return 0;
    case 'RIDER_ASSIGNED':
      return 1;
    case 'PICKED_UP':
      return 2;
    case 'IN_CLEANING':
      return 3;
    case 'OUT_FOR_DELIVERY':
      return 4;
    case 'COMPLETED':
      return 5;
    default:
      return 0;
  }
}

export default function ActiveOrderTracker({ order, isLoading = false }: ActiveOrderTrackerProps) {
  const [expanded, setExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-[#1A0A5E] border-r-transparent mb-2" />
        <p className="text-sm text-gray-500 font-medium">Checking active order status...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 md:p-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1A0A5E] shrink-0">
              <Package size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A0A5E]">No Active Orders Right Now</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                Your garments and premises are all set! Schedule your next laundry pickup or
                certified fumigation anytime.
              </p>
            </div>
          </div>
          <Link
            href="/customer/new-order"
            className="rounded-xl bg-[#1A0A5E] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#120843] transition-colors flex items-center gap-1.5 shadow-sm"
          >
            Book New Service <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  const isFumigation = order.serviceType === 'FUMIGATION';
  const stageIndex = getStageIndex(order.status);
  const orderNumber = `ORD-${order.id.slice(0, 6).toUpperCase()}`;

  const itemsSummary = isFumigation
    ? order.items?.[0]?.itemName || 'Residential Fumigation'
    : order.items && order.items.length > 0
      ? `${order.items.reduce((acc: number, i: any) => acc + i.quantity, 0)} pieces`
      : 'Laundry Service';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-sm font-bold text-[#1A0A5E]">Active Order Tracker</span>
          </div>
          <span className="text-xs text-gray-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-lg">
            #{orderNumber}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          aria-label={expanded ? 'Collapse tracker' : 'Expand tracker'}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="p-5">
          {/* Order Details Row */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Service
              </div>
              <div className="text-sm font-bold text-[#1A0A5E] flex items-center gap-1">
                {isFumigation ? (
                  <>
                    <ShieldCheck size={14} className="text-emerald-600" /> Fumigation
                  </>
                ) : (
                  <>
                    <Package size={14} className="text-[#CC0000]" /> Laundry
                  </>
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Details
              </div>
              <div className="text-sm font-bold text-slate-700 truncate">{itemsSummary}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Amount Due
              </div>
              <div className="text-sm font-black text-[#1A0A5E] font-mono">
                ₦{(order.totalAmount || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Assigned Rider Contact info if present */}
          {order.rider?.user && (
            <div className="mb-5 p-3 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                  Assigned Dispatch Rider
                </span>
                <p className="text-xs font-bold text-[#1A0A5E] mt-0.5">
                  {order.rider.user.fullName}
                </p>
              </div>
              {order.rider.user.phone && (
                <a
                  href={`tel:${order.rider.user.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-xs font-semibold text-[#1A0A5E] hover:bg-purple-100/50"
                >
                  <Phone size={12} className="text-purple-700" /> {order.rider.user.phone}
                </a>
              )}
            </div>
          )}

          {/* Timeline Stages */}
          <div className="relative space-y-3">
            {ORDER_STAGES.map((stage, idx) => {
              const isDone = idx <= stageIndex;
              const isActive = idx === stageIndex;

              return (
                <div key={stage.key} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isActive
                        ? 'bg-orange-100 ring-2 ring-orange-500 text-orange-600'
                        : isDone
                          ? 'bg-green-100 text-green-600'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={14} /> : <Circle size={10} />}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isActive
                          ? 'text-orange-600 font-bold'
                          : isDone
                            ? 'text-slate-800'
                            : 'text-slate-400'
                      }`}
                    >
                      {stage.label}
                    </span>
                    {isActive && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full animate-pulse">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 text-right">
            <Link
              href={`/customer/orders/${order.id}`}
              className="text-xs font-bold text-[#1A0A5E] hover:underline"
            >
              View Full Order Details →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
