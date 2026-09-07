'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, Search, Menu, X, User } from 'lucide-react';

interface CustomerTopbarProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle: () => void;
  mobileMenuOpen: boolean;
  customerName?: string;
}

export default function CustomerTopbar({
  sidebarCollapsed,
  onMobileMenuToggle,
  mobileMenuOpen,
  customerName,
}: CustomerTopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);

  const initials = customerName
    ? customerName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SP';

  return (
    <div className="w-full flex items-center justify-between">
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
            placeholder="Search orders, invoices..."
            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A0A5E]/20 focus:border-[#1A0A5E] w-64"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Customer Avatar & Profile Link */}
        <Link
          href="/customer/profile"
          className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 transition-colors group"
          title="View profile settings"
        >
          <div className="w-8 h-8 rounded-full bg-[#1A0A5E] text-white text-xs font-bold flex items-center justify-center group-hover:ring-2 group-hover:ring-[#1A0A5E]/40 transition-all">
            {initials}
          </div>
          {customerName && (
            <span className="hidden md:inline text-xs font-semibold text-slate-700 group-hover:text-[#1A0A5E]">
              {customerName}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
