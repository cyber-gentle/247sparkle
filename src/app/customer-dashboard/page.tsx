'use client';

import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import CustomerSidebar from './components/CustomerSidebar';
import CustomerTopbar from './components/CustomerTopbar';
import CustomerKPICards from './components/CustomerKPICards';
import ActiveOrderTracker from './components/ActiveOrderTracker';
import RecentOrdersTable from './components/RecentOrdersTable';
import QuickActions from './components/QuickActions';
import CertificatesWidget from './components/CertificatesWidget';
import { Sparkles, Loader } from 'lucide-react';

interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
}

export default function CustomerDashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [profileRes, ordersRes] = await Promise.all([
          fetch('/api/customer/profile'),
          fetch('/api/orders'),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.customer) {
            setCustomer(profileData.customer);
          }
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.orders || []);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const totalOrders = orders.length;

  const activeOrders = orders.filter((o) =>
    [
      'PENDING',
      'PAID_UNASSIGNED',
      'RIDER_ASSIGNED',
      'PICKED_UP',
      'IN_CLEANING',
      'OUT_FOR_DELIVERY',
    ].includes(o.status)
  );

  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');

  const totalSpent = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const mostActiveOrder = activeOrders[0] || null;

  const firstName = customer?.fullName ? customer.fullName.split(' ')[0] : 'there';

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
            customerName={customer?.fullName}
          />
        </div>

        {/* Page Content */}
        <main className="flex-1 pt-16 px-6 xl:px-8 2xl:px-10 py-6 max-w-screen-2xl w-full mx-auto">
          {/* Greeting */}
          <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-[#F5C200]" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Customer Portal
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-[#1A0A5E]">
                Welcome back,{' '}
                <span className="text-[#CC0000]">{isLoading ? '...' : firstName}</span> 👋
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isLoading ? (
                  'Loading your account summary...'
                ) : activeOrders.length === 0 ? (
                  'No active orders right now. Ready to book laundry or certified fumigation?'
                ) : activeOrders.length === 1 ? (
                  <>
                    You have <strong className="text-[#CC0000]">1 active order</strong> currently in
                    progress.
                  </>
                ) : (
                  <>
                    You have{' '}
                    <strong className="text-[#CC0000]">{activeOrders.length} active orders</strong>{' '}
                    in progress.
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-200 rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              Live Dashboard
            </div>
          </div>

          {/* KPI Cards */}
          <div className="mb-6">
            <CustomerKPICards
              totalOrders={totalOrders}
              activeOrders={activeOrders.length}
              completedOrders={completedOrders.length}
              totalSpent={totalSpent}
              isLoading={isLoading}
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            {/* Active Tracker + Recent Orders — Left 2 cols */}
            <div className="xl:col-span-2 space-y-6">
              <ActiveOrderTracker order={mostActiveOrder} isLoading={isLoading} />
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
