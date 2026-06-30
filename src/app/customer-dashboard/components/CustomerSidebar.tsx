'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { LayoutDashboard, PlusCircle, Package, FileText, User, LogOut, ChevronLeft, ChevronRight, MapPin,  } from 'lucide-react';


const NAV_ITEMS = [
  { id: 'nav-dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/customer/dashboard', badge: null },
  { id: 'nav-new-order', label: 'New Order', icon: PlusCircle, href: '/customer/new-order', badge: null },
  { id: 'nav-orders', label: 'My Orders', icon: Package, href: '/customer/orders', badge: '3' },
  { id: 'nav-track', label: 'Track Order', icon: MapPin, href: '/customer/orders/sample-order-001', badge: null },
  { id: 'nav-certificates', label: 'Certificates', icon: FileText, href: '/customer/certificates', badge: '1' },
  { id: 'nav-profile', label: 'My Profile', icon: User, href: '/customer/profile', badge: null },
];

interface CustomerSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function CustomerSidebar({ collapsed, onToggle }: CustomerSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-[#1A0A5E] transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 border-b border-white/10 px-4 ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
        <AppLogo size={32} />
        {!collapsed && (
          <div className="flex flex-col leading-none overflow-hidden">
            <span className="font-extrabold text-base whitespace-nowrap">
              <span className="text-[#F5C200]">247</span>
              <span className="text-[#CC0000]"> Sparkle</span>
            </span>
            <span className="text-[9px] font-medium tracking-widest uppercase text-white/40">Customer Portal</span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="px-4 mb-2 text-[10px] font-bold tracking-widest uppercase text-white/30">Menu</p>
        )}
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative ${
                    isActive
                      ? 'bg-[#F5C200] text-[#1A0A5E]'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-semibold">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto bg-[#CC0000] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && item.badge && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#CC0000] rounded-full" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 p-2">
        {/* User info */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-[#F5C200] flex items-center justify-center text-[#1A0A5E] text-xs font-bold shrink-0">
              AO
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">Adaeze Okonkwo</div>
              <div className="text-[10px] text-white/40 truncate">adaeze@gmail.com</div>
            </div>
          </div>
        )}
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all duration-150 ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm font-semibold">Sign Out</span>}
        </Link>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#F5C200] text-[#1A0A5E] flex items-center justify-center shadow-md hover:bg-[#E6B000] transition-colors z-50"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
