'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';

export interface PortalSidebarRenderProps {
  /** Desktop-only rail state. Always `false` while the mobile drawer is open. */
  collapsed: boolean;
  /** Toggles the desktop rail. Hidden on mobile, where the drawer is used instead. */
  onToggle: () => void;
  /** True while the mobile off-canvas drawer is showing. */
  mobileOpen: boolean;
  /** Call from nav links so tapping an item closes the mobile drawer. */
  onNavigate: () => void;
}

interface PortalShellProps {
  /** Rendered as a fixed `<aside>`; receives the shell's layout state. */
  sidebar: (props: PortalSidebarRenderProps) => React.ReactNode;
  children: React.ReactNode;
  /** localStorage key used to remember the desktop rail preference. */
  storageKey: string;
  /** Shown beside the logo in the mobile top bar. */
  title: string;
}

/**
 * Persistent portal chrome.
 *
 * This lives in a Next.js `layout.tsx`, not in a page, which is what keeps the
 * sidebar mounted across navigations — previously each portal page rendered its
 * own sidebar (or none at all), so moving from the dashboard to Orders/Riders
 * unmounted it and the sidebar appeared to vanish.
 *
 * Responsive behaviour:
 * - `lg` and up: a fixed rail that collapses to icons. Starts collapsed so the
 *   content area is the focus on first login, and the choice is remembered.
 * - Below `lg`: the rail is an off-canvas drawer behind a scrim, opened from the
 *   mobile top bar and closed automatically on navigation. It is always shown
 *   expanded there, because an icon-only rail is unusable on a 360px screen.
 */
export default function PortalShell({ sidebar, children, storageKey, title }: PortalShellProps) {
  // Collapsed by default: the owner asked for the sidebar to start collapsed on login.
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Restore the remembered desktop preference after mount. Reading localStorage
  // during render would desync server and client HTML.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored !== null) setCollapsed(stored === 'true');
    } catch {
      // Private mode / storage disabled: keep the collapsed default.
    }
  }, [storageKey]);

  const handleToggle = useCallback(() => {
    setCollapsed((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(storageKey, String(next));
      } catch {
        // Persisting is best-effort; the session still works without it.
      }
      return next;
    });
  }, [storageKey]);

  // Close the drawer whenever the route changes, so tapping a nav item does not
  // leave the scrim covering the page the user just asked for.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // If the viewport grows past `lg` while the drawer is open, drop the drawer
  // state so the desktop rail renders with the user's real collapsed preference.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) setMobileOpen(false);
    };
    handleChange(query);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  // Lock body scroll behind the drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white border-b border-gray-100 flex items-center gap-3 px-4">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg text-[#1A0A5E] hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          <Menu size={22} />
        </button>
        <AppLogo size={26} />
        <span className="text-sm font-bold text-[#1A0A5E] truncate">{title}</span>
      </header>

      {/* Scrim */}
      <div
        onClick={closeMobile}
        aria-hidden="true"
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {sidebar({
        collapsed: mobileOpen ? false : collapsed,
        onToggle: handleToggle,
        mobileOpen,
        onNavigate: closeMobile,
      })}

      {/* Drawer close button, rendered above the sidebar */}
      {mobileOpen && (
        <button
          type="button"
          onClick={closeMobile}
          className="lg:hidden fixed top-3 left-[15rem] z-50 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      )}

      {/* Content */}
      <div
        className={`pt-14 lg:pt-0 transition-[margin] duration-300 ${
          collapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
