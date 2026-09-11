'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import PortalShell from '@/components/portal/PortalShell';
import CustomerSidebar from '@/app/customer-dashboard/components/CustomerSidebar';

/** Public routes under /customer that must render without portal chrome. */
const BARE_ROUTES = ['/customer/login', '/customer/signup'];

/**
 * Persistent chrome for the customer portal.
 *
 * Living in a layout (rather than in each page) is what keeps the sidebar
 * mounted while navigating between Orders, Certificates, Profile and so on.
 */
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (BARE_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <PortalShell
      storageKey="sparkle:customer-sidebar-collapsed"
      title="Customer Portal"
      sidebar={({ collapsed, onToggle, mobileOpen, onNavigate }) => (
        <CustomerSidebar
          collapsed={collapsed}
          onToggle={onToggle}
          mobileOpen={mobileOpen}
          onNavigate={onNavigate}
        />
      )}
    >
      <Toaster position="bottom-right" richColors />
      {children}
    </PortalShell>
  );
}
