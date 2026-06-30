'use client';
import React, { useState } from 'react';
import { Toaster } from 'sonner';
import AdminSidebar from './components/AdminSidebar';
import AdminTopbar from './components/AdminTopbar';
import AdminKPIBento from './components/AdminKPIBento';
import RevenueChart from './components/RevenueChart';
import ServiceBreakdownChart from './components/ServiceBreakdownChart';
import AdminOrdersFeed from './components/AdminOrdersFeed';
import AlertsPanel from './components/AlertsPanel';
import RiderStatusGrid from './components/RiderStatusGrid';
import { LayoutDashboard } from 'lucide-react';

export default function AdminDashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster position="bottom-right" richColors />

      {/* Sidebar */}
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}
      >
        {/* Topbar */}
        <AdminTopbar sidebarCollapsed={sidebarCollapsed} />

        {/* Page Content */}
        <main className="flex-1 pt-16 px-6 xl:px-8 2xl:px-10 py-6 max-w-screen-2xl w-full mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <LayoutDashboard size={16} className="text-gray-400" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Admin Console</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-[#1A0A5E]">
                Platform Overview
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Thursday, 23 April 2026 — Otukpo, Benue State
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white border border-gray-200 rounded-xl px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live data — updated just now
              </div>
              <button className="bg-[#F5C200] text-[#1A0A5E] font-bold text-xs px-4 py-2 rounded-xl hover:bg-[#E6B000] active:scale-95 transition-all">
                Export Report
              </button>
            </div>
          </div>

          {/* KPI Bento Grid */}
          <div className="mb-6">
            <AdminKPIBento />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
            <div className="xl:col-span-2">
              <RevenueChart />
            </div>
            <div>
              <ServiceBreakdownChart />
            </div>
          </div>

          {/* Orders Feed + Alerts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
            <div className="xl:col-span-2">
              <AdminOrdersFeed />
            </div>
            <div>
              <AlertsPanel />
            </div>
          </div>

          {/* Rider Status Grid */}
          <div className="mb-6">
            <RiderStatusGrid />
          </div>
        </main>
      </div>
    </div>
  );
}