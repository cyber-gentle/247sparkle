'use client';
import React, { useState } from 'react';
import { Toaster, toast } from 'sonner';
import AdminSidebar from './components/AdminSidebar';
import AdminTopbar from './components/AdminTopbar';
import AdminKPIBento from './components/AdminKPIBento';
import RevenueChart from './components/RevenueChart';
import ServiceBreakdownChart from './components/ServiceBreakdownChart';
import AdminOrdersFeed from './components/AdminOrdersFeed';
import AlertsPanel from './components/AlertsPanel';
import RiderStatusGrid from './components/RiderStatusGrid';
import { LayoutDashboard, Download } from 'lucide-react';

type RevenuePoint = { day: string; revenue: number; orders: number };

export default function AdminDashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  async function exportReport() {
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      const series: RevenuePoint[] = data.revenueSeries ?? [];

      // Minimal CSV: header + one row per day of the 14-day window.
      const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const rows = [
        ['Day', 'Revenue (NGN)', 'Orders'].join(','),
        ...series.map((p) => [escapeCsv(p.day), p.revenue, p.orders].join(',')),
      ];
      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `247sparkle-revenue-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Revenue report downloaded');
    } catch {
      toast.error('Export failed — could not load stats');
    } finally {
      setIsExporting(false);
    }
  }

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
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Admin Console
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-[#1A0A5E]">
                Platform Overview
              </h1>
              <p className="text-sm text-gray-500 mt-1">{todayFormatted} — Otukpo, Benue State</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white border border-gray-200 rounded-xl px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                Data as of page load
              </div>
              <button
                onClick={exportReport}
                disabled={isExporting}
                className="bg-[#F5C200] text-[#1A0A5E] font-bold text-xs px-4 py-2 rounded-xl hover:bg-[#E6B000] active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Download size={12} />
                {isExporting ? 'Exporting…' : 'Export Report'}
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
