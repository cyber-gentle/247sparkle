'use client';
import React from 'react';
import { Bike, MapPin } from 'lucide-react';

interface Rider {
  id: string;
  name: string;
  initials: string;
  availability: 'working' | 'off_duty';
  currentJob: string | null;
  area: string;
  jobsToday: number;
  earned: string;
}

const RIDERS: Rider[] = [
  { id: 'rider-grid-001', name: 'Tunde Kazeem', initials: 'TK', availability: 'working', currentJob: 'ORD-2025-0047', area: 'VI → Lekki', jobsToday: 4, earned: '₦3,200' },
  { id: 'rider-grid-002', name: 'Segun Afolabi', initials: 'SA', availability: 'working', currentJob: 'ORD-2025-0046', area: 'Ikeja → Yaba', jobsToday: 3, earned: '₦2,400' },
  { id: 'rider-grid-003', name: 'Emmanuel Ojo', initials: 'EO', availability: 'working', currentJob: 'ORD-2025-0044', area: 'Mushin → Surulere', jobsToday: 5, earned: '₦4,000' },
  { id: 'rider-grid-004', name: 'Biodun Lawal', initials: 'BL', availability: 'working', currentJob: null, area: 'Ojodu — Idle', jobsToday: 2, earned: '₦1,600' },
  { id: 'rider-grid-005', name: 'Chukwudi Eze', initials: 'CE', availability: 'working', currentJob: null, area: 'Agege — Idle', jobsToday: 1, earned: '₦800' },
  { id: 'rider-grid-006', name: 'Musa Ibrahim', initials: 'MI', availability: 'off_duty', currentJob: null, area: 'Off today', jobsToday: 0, earned: '₦0' },
  { id: 'rider-grid-007', name: 'Lanre Adebayo', initials: 'LA', availability: 'working', currentJob: 'ORD-2025-0049', area: 'Yaba → Mainland', jobsToday: 3, earned: '₦2,400' },
  { id: 'rider-grid-008', name: 'Tobi Nwachukwu', initials: 'TN', availability: 'off_duty', currentJob: null, area: 'Off today', jobsToday: 0, earned: '₦0' },
];

export default function RiderStatusGrid() {
  const working = RIDERS.filter((r) => r.availability === 'working').length;
  const onJob = RIDERS.filter((r) => r.currentJob !== null).length;

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

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {RIDERS.map((rider) => (
          <div
            key={rider.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
              rider.currentJob
                ? 'border-orange-200 bg-orange-50/30'
                : rider.availability === 'working' ?'border-green-200 bg-green-50/20' :'border-gray-100 bg-gray-50/50 opacity-60'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                rider.availability === 'off_duty' ?'bg-gray-200 text-gray-500'
                  : rider.currentJob
                  ? 'bg-orange-100 text-orange-700' :'bg-green-100 text-green-700'
              }`}
            >
              {rider.initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-bold text-gray-700 truncate">{rider.name}</span>
                {rider.availability === 'working' ? (
                  rider.currentJob ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                  )
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <MapPin size={9} />
                <span className="truncate">{rider.area}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="text-right shrink-0">
              <div className="text-xs font-bold text-[#1A0A5E] font-mono-nums">{rider.earned}</div>
              <div className="text-[10px] text-gray-400">{rider.jobsToday} jobs</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}