'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import PortalShell from '@/components/portal/PortalShell';
import AdminSidebar from '@/app/admin-dashboard/components/AdminSidebar';

/** Routes under /admin that must render without portal chrome. */
const BARE_ROUTES = ['/admin/login'];

/**
 * Persistent chrome for the admin portal.
 *
 * Living in a layout (rather than in each page) is what keeps the sidebar
 * mounted while navigating between Orders, Riders, Partners and so on.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (BARE_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <PortalShell
      storageKey="sparkle:admin-sidebar-collapsed"
      title="Admin Console"
      sidebar={({ collapsed, onToggle, mobileOpen, onNavigate }) => (
        <AdminSidebar
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
