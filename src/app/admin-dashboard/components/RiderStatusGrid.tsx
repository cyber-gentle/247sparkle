'use client';
import React, { useEffect, useState } from 'react';
import { Bike, MapPin, Loader } from 'lucide-react';

type RiderStatus = {
  id: string;
  availabilityStatus: string;
  user: { fullName: string };
  assignedOrders: { id: string }[];
  commissions: { amount: number }[];
};

export default function RiderStatusGrid() {
  const [riders, setRiders] = useState<RiderStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => setRiders(d.riderStatuses ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const working = riders.filter((r) => r.availabilityStatus === 'WORKING').length;
  const onJob = riders.filter((r) => r.assignedOrders.length > 0).length;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card flex items-center justify-center py-12">
        <Loader className="animate-spin text-[#1A0A5E]" size={22} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1A0A5E]">Rider Status</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            <span className="text-green-600 font-semibold">{working} working</span>
            {' · '}
            <span className="text-orange-500 font-semibold">{onJob} on a job</span>
          </p>
        </div>
        <Bike size={18} className="text-gray-300" />
      </div>

      {riders.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">No approved riders yet.</p>
      ) : (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {riders.map((rider) => {
            const isWorking = rider.availabilityStatus === 'WORKING';
            const isOnJob = rider.assignedOrders.length > 0;
            const todayEarnings = rider.commissions.reduce((s, c) => s + c.amount, 0);
            const initials = rider.user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

            return (
              <div
                key={rider.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                  isOnJob
                    ? 'border-orange-200 bg-orange-50/30'
                    : isWorking
                    ? 'border-green-200 bg-green-50/20'
                    : 'border-gray-100 bg-gray-50/50 opacity-60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    !isWorking
                      ? 'bg-gray-200 text-gray-500'
                      : isOnJob
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold text-gray-700 truncate">{rider.user.fullName}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        !isWorking ? 'bg-gray-300' : isOnJob ? 'bg-orange-400' : 'bg-green-400'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <MapPin size={9} />
                    <span className="truncate">
                      {!isWorking ? 'Off duty' : isOnJob ? 'On a job' : 'Available'}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-[#1A0A5E] font-mono-nums">
                    ₦{todayEarnings.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-400">{rider.assignedOrders.length} active</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
