'use client';
import React, { useState } from 'react';
import { Toaster } from 'sonner';
import CustomerSidebar from './components/CustomerSidebar';
import CustomerTopbar from './components/CustomerTopbar';
import CustomerKPICards from './components/CustomerKPICards';
import ActiveOrderTracker from './components/ActiveOrderTracker';
import RecentOrdersTable from './components/RecentOrdersTable';
import QuickActions from './components/QuickActions';
import CertificatesWidget from './components/CertificatesWidget';
import { Sparkles } from 'lucide-react';

export default function CustomerDashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster position="bottom-right" richColors />

      {/* Sidebar */}
      <CustomerSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}
      >
        {/* Topbar */}
        <div
          className="fixed top-0 right-0 z-30 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 transition-all duration-300"
          style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
        >
          <CustomerTopbar
            sidebarCollapsed={sidebarCollapsed}
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
            mobileMenuOpen={mobileMenuOpen}
          />
        </div>

        {/* Page Content */}
        <main className="flex-1 pt-16 px-6 xl:px-8 2xl:px-10 py-6 max-w-screen-2xl w-full mx-auto">
          {/* Greeting */}
          <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-[#F5C200]" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Customer Portal</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-[#1A0A5E]">
                Welcome back, <span className="text-[#CC0000]">Adaeze</span> 👋
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                You have <strong className="text-[#CC0000]">3 active orders</strong> — 1 out for delivery right now.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-200 rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              Last updated: Just now
            </div>
          </div>

          {/* KPI Cards */}
          <div className="mb-6">
            <CustomerKPICards />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            {/* Active Tracker + Recent Orders — Left 2 cols */}
            <div className="xl:col-span-2 space-y-6">
              <ActiveOrderTracker />
              <RecentOrdersTable />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <QuickActions />
              <CertificatesWidget />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}