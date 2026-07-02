'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { LayoutDashboard, ShoppingBag, Bike, Store, Users, DollarSign, FileText, MessageSquare, Tag, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';


const NAV_GROUPS = [
  {
    id: 'group-overview',
    label: 'Overview',
    items: [
      { id: 'admin-nav-dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard', badge: null },
    ],
  },
  {
    id: 'group-operations',
    label: 'Operations',
    items: [
      { id: 'admin-nav-orders', label: 'Orders', icon: ShoppingBag, href: '/admin/orders', badge: '12' },
      { id: 'admin-nav-riders', label: 'Riders', icon: Bike, href: '/admin/riders', badge: '3', badgeAlert: true },
      { id: 'admin-nav-partners', label: 'Partners', icon: Store, href: '/admin/partners', badge: '2', badgeAlert: true },
      { id: 'admin-nav-customers', label: 'Customers', icon: Users, href: '/admin/customers', badge: null },
    ],
  },
  {
    id: 'group-finance',
    label: 'Finance & Content',
    items: [
      { id: 'admin-nav-finance', label: 'Finance', icon: DollarSign, href: '/admin/finance', badge: null },
      { id: 'admin-nav-certs', label: 'Certificates', icon: FileText, href: '/admin/certificates', badge: null },
      { id: 'admin-nav-quotations', label: 'Quotations', icon: MessageSquare, href: '/admin/quotations', badge: '5' },
      { id: 'admin-nav-pricing', label: 'Pricing', icon: Tag, href: '/admin/pricing', badge: null },
    ],
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Signed out');
    router.push('/admin/login');
  }

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-[#0F0630] transition-all duration-300 ease-in-out ${
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
            <span className="text-[9px] font-medium tracking-widest uppercase text-white/30">Admin Console</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="mb-4">
            {!collapsed && (
              <p className="px-4 mb-1.5 text-[10px] font-bold tracking-widest uppercase text-white/25">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative ${
                        isActive
                          ? 'bg-[#F5C200] text-[#1A0A5E]'
                          : 'text-white/65 hover:bg-white/8 hover:text-white'
                      } ${collapsed ? 'justify-center' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={17} className="shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="text-sm font-semibold">{item.label}</span>
                          {item.badge && (
                            <span
                              className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                                item.badgeAlert
                                  ? 'bg-[#CC0000] text-white'
                                  : 'bg-white/15 text-white'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {collapsed && item.badge && item.badgeAlert && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-[#CC0000] rounded-full" />
                )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 p-2">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-[#CC0000] flex items-center justify-center text-white text-xs font-bold shrink-0">
              AD
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">Admin User</div>
              <div className="text-[10px] text-white/35 truncate">247biz@gmail.com</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-all duration-150 ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={17} className="shrink-0" />
          {!collapsed && <span className="text-sm font-semibold">Sign Out</span>}
        </button>
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
