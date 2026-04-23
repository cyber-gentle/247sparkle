'use client';
import React, { useState } from 'react';
import { Bell, Search, AlertTriangle } from 'lucide-react';

const ADMIN_ALERTS = [
  { id: 'alert-001', text: '3 new rider applications awaiting approval', time: '5 mins ago', type: 'warning', read: false },
  { id: 'alert-002', text: '2 new partner applications pending review', time: '18 mins ago', type: 'warning', read: false },
  { id: 'alert-003', text: 'Order #ORD-2025-0051 payment failed — manual review needed', time: '42 mins ago', type: 'error', read: false },
  { id: 'alert-004', text: '5 new quotation requests received today', time: '1 hr ago', type: 'info', read: true },
  { id: 'alert-005', text: 'Rider Tunde Kazeem requested ₦12,500 withdrawal', time: '2 hrs ago', type: 'info', read: true },
];

interface AdminTopbarProps {
  sidebarCollapsed: boolean;
}

export default function AdminTopbar({ sidebarCollapsed }: AdminTopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = ADMIN_ALERTS.filter((a) => !a.read).length;

  return (
    <div
      className="fixed top-0 right-0 z-30 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 transition-all duration-300"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      {/* Search */}
      <div className="relative hidden sm:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search orders, riders, customers..."
          className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C200]/30 focus:border-[#F5C200] w-72"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Alert indicator */}
        {unread > 0 && (
          <div className="hidden md:flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
            <AlertTriangle size={13} className="text-amber-600" />
            <span className="text-xs font-bold text-amber-700">{unread} alerts need attention</span>
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Admin notifications"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#CC0000] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-88 bg-white rounded-2xl border border-gray-100 shadow-lg z-50 animate-fade-in" style={{ width: '22rem' }}>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-bold text-[#1A0A5E]">Admin Alerts</span>
                <span className="text-xs text-[#CC0000] font-semibold cursor-pointer hover:underline">Clear all</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {ADMIN_ALERTS.map((alert) => (
                  <div
                    key={alert.id}
                    className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !alert.read
                        ? alert.type === 'error' ?'bg-red-50/40'
                          : alert.type === 'warning' ?'bg-amber-50/40' :'bg-blue-50/20' :''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                          alert.type === 'error' ?'bg-red-500'
                            : alert.type === 'warning' ?'bg-amber-500' :'bg-blue-400'
                        }`}
                      />
                      <div>
                        <p className="text-xs text-gray-700 leading-relaxed">{alert.text}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{alert.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Admin Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#CC0000] text-white text-xs font-bold flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#CC0000]/40 transition-all">
          AD
        </div>
      </div>
    </div>
  );
}