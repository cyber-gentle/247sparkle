'use client';
import React, { useState } from 'react';
import { CheckCircle2, Circle, MapPin, Phone, ChevronDown, ChevronUp } from 'lucide-react';

const ORDER_STAGES = [
  { id: 'stage-placed', key: 'placed', label: 'Order Placed', time: '09:15 AM', done: true },
  { id: 'stage-assigned', key: 'rider_assigned', label: 'Rider Assigned', time: '09:32 AM', done: true },
  { id: 'stage-picked', key: 'picked_up', label: 'Picked Up', time: '10:08 AM', done: true },
  { id: 'stage-cleaning', key: 'in_cleaning', label: 'In Cleaning', time: '11:00 AM', done: true },
  { id: 'stage-out', key: 'out_for_delivery', label: 'Out for Delivery', time: '2:45 PM', done: true, active: true },
  { id: 'stage-delivered', key: 'delivered', label: 'Delivered', time: 'Est. 3:30 PM', done: false },
];

export default function ActiveOrderTracker() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-sm font-bold text-[#1A0A5E]">Active Order Tracker</span>
          </div>
          <span className="text-xs text-gray-400 font-mono-nums bg-gray-50 px-2 py-0.5 rounded-lg">
            #ORD-2025-0047
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
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Service</div>
              <div className="text-sm font-bold text-[#1A0A5E]">Laundry</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Items</div>
              <div className="text-sm font-bold text-[#1A0A5E]">6 pieces</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Amount</div>
              <div className="text-sm font-bold text-[#1A0A5E] font-mono-nums">₦4,500</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {ORDER_STAGES?.map((stage, idx) => (
              <div key={stage?.id} className="flex items-start gap-3 mb-4 last:mb-0">
                {/* Icon */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      stage?.done && stage?.active
                        ? 'bg-orange-100 ring-2 ring-orange-400 ring-offset-1'
                        : stage?.done
                        ? 'bg-green-100' :'bg-gray-100'
                    }`}
                  >
                    {stage?.done ? (
                      <CheckCircle2
                        size={14}
                        className={stage?.active ? 'text-orange-500' : 'text-green-500'}
                      />
                    ) : (
                      <Circle size={14} className="text-gray-300" />
                    )}
                  </div>
                  {idx < ORDER_STAGES?.length - 1 && (
                    <div
                      className={`w-px h-8 mt-1 ${stage?.done ? 'bg-green-200' : 'bg-gray-100'}`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex items-start justify-between flex-1 pt-0.5">
                  <span
                    className={`text-sm font-semibold ${
                      stage?.active ? 'text-orange-600' : stage?.done ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {stage?.label}
                    {stage?.active && (
                      <span className="ml-2 text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </span>
                  <span className={`text-xs font-mono-nums ${stage?.done ? 'text-gray-500' : 'text-gray-300'}`}>
                    {stage?.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Rider Info */}
          <div className="mt-5 p-4 bg-[#1A0A5E]/5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1A0A5E] text-white text-xs font-bold flex items-center justify-center">
                TK
              </div>
              <div>
                <div className="text-xs font-bold text-[#1A0A5E]">Tunde Kazeem</div>
                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                  <MapPin size={10} />
                  2.3 km away · Est. 12 mins
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="tel:08012345678"
                className="flex items-center gap-1.5 bg-[#1A0A5E] text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-[#2D1B8E] transition-colors"
              >
                <Phone size={12} />
                Call Rider
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}