'use client';
import React, { useState } from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';

interface CustomerTopbarProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle: () => void;
  mobileMenuOpen: boolean;
}

const NOTIFICATIONS = [
  { id: 'notif-001', text: 'Your laundry order #ORD-2025-0047 is out for delivery', time: '12 mins ago', read: false },
  { id: 'notif-002', text: 'Fumigation certificate ready for download', time: '2 hrs ago', read: false },
  { id: 'notif-003', text: 'Order #ORD-2025-0044 delivered successfully', time: 'Yesterday', read: true },
];

export default function CustomerTopbar({ sidebarCollapsed, onMobileMenuToggle, mobileMenuOpen }: CustomerTopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 transition-all duration-300 ${
        sidebarCollapsed ? 'left-16' : 'left-64'
      }`}
      style={{ left: undefined }}
    >
      <div
        className={`fixed top-0 right-0 z-30 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 transition-all duration-300`}
        style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
      />

      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="relative hidden sm:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C200]/30 focus:border-[#F5C200] w-64"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#CC0000] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-gray-100 shadow-lg z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-bold text-[#1A0A5E]">Notifications</span>
                <span className="text-xs text-[#CC0000] font-semibold cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !n.read ? 'bg-[#FEF3C7]/30' : ''
                    }`}
                  >
                    <p className="text-xs text-gray-700 leading-relaxed mb-1">{n.text}</p>
                    <p className="text-[10px] text-gray-400">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#F5C200] text-[#1A0A5E] text-xs font-bold flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#F5C200]/50 transition-all">
          AO
        </div>
      </div>
    </header>
  );
}