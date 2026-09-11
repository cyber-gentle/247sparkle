'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

const FOOTER_SERVICES = [
  'Laundry',
  'Home Cleaning',
  'Office Cleaning',
  'Fumigation',
  'Pickup & Delivery',
];

const FOOTER_QUICK_LINKS = [
  { label: 'Book a Service', href: '/customer/signup' },
  { label: 'Track Your Order', href: '/customer/orders' },
  { label: 'Become a Partner', href: '/become-a-partner' },
  { label: 'Verify Certificate', href: '/verify' },
  { label: 'Admin Login', href: '/admin/login' },
];

const FOOTER_TABS = [
  { id: 'services', label: 'Services' },
  { id: 'quick-links', label: 'Quick Links' },
  { id: 'contact', label: 'Contact Us' },
] as const;

type FooterTabId = (typeof FOOTER_TABS)[number]['id'];

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function ServicesList({ linkClassName = '' }: { linkClassName?: string }) {
  return (
    <ul className="space-y-2.5">
      {FOOTER_SERVICES?.map((s) => (
        <li key={`footer-service-${s?.toLowerCase()?.replace(/\s+/g, '-')}`}>
          <Link
            href="/services"
            className={`text-sm text-white/65 hover:text-white transition-colors ${linkClassName}`}
          >
            {s}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function QuickLinksList({ linkClassName = '' }: { linkClassName?: string }) {
  return (
    <ul className="space-y-2.5">
      {FOOTER_QUICK_LINKS?.map((link) => (
        <li key={`footer-link-${link?.label?.toLowerCase()?.replace(/\s+/g, '-')}`}>
          <Link
            href={link?.href}
            className={`text-sm text-white/65 hover:text-white transition-colors ${linkClassName}`}
          >
            {link?.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ContactList({ centered = false }: { centered?: boolean }) {
  const rowAlign = centered ? ' justify-center' : '';

  return (
    <ul className="space-y-3">
      <li className={`flex items-start gap-2.5 text-sm text-white/65${rowAlign}`}>
        <MapPin size={16} className="mt-0.5 shrink-0 text-[#F5C200]" />
        Otukpo, Benue State
      </li>
      <li>
        <a
          href="tel:09039661885"
          className={`flex items-center gap-2.5 text-sm text-white/65 hover:text-white transition-colors${rowAlign}`}
        >
          <Phone size={16} className="shrink-0 text-[#F5C200]" />
          09039661885
        </a>
      </li>
      <li>
        <a
          href="tel:07052258764"
          className={`flex items-center gap-2.5 text-sm text-white/65 hover:text-white transition-colors${rowAlign}`}
        >
          <Phone size={16} className="shrink-0 text-[#F5C200]" />
          07052258764 (WhatsApp)
        </a>
      </li>
      <li>
        <a
          href="mailto:info.247sparkle@gmail.com"
          className={`flex items-center gap-2.5 text-sm text-white/65 hover:text-white transition-colors${rowAlign}`}
        >
          <Mail size={16} className="shrink-0 text-[#F5C200]" />
          info.247sparkle@gmail.com
        </a>
      </li>
      <li>
        <a
          href="https://wa.me/2347052258764"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-1 bg-[#25D366] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#1da851] transition-colors"
        >
          <MessageCircle size={15} />
          Chat on WhatsApp
        </a>
      </li>
    </ul>
  );
}

/**
 * Phone-only tab strip. The three footer sections collapse into a single row of
 * tabs with one centered panel underneath, which keeps the mobile page short
 * without hiding anything. Desktop keeps the classic four-column layout.
 */
function MobileFooterTabs() {
  const [activeTab, setActiveTab] = useState<FooterTabId>('services');
  const [isOpen, setIsOpen] = useState(true);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Partial<Record<FooterTabId, HTMLButtonElement | null>>>({});

  // Measure the active panel so the open/close and tab-to-tab height changes
  // can be handed off to a plain CSS transition.
  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const measure = () => setPanelHeight(element.scrollHeight);
    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [activeTab]);

  const handleTabClick = (tabId: FooterTabId) => {
    if (tabId === activeTab) {
      setIsOpen((previous) => !previous);
      return;
    }
    setActiveTab(tabId);
    setIsOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = FOOTER_TABS.length - 1;
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = lastIndex;

    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = FOOTER_TABS[nextIndex];
    setActiveTab(nextTab.id);
    setIsOpen(true);
    tabRefs.current[nextTab.id]?.focus();
  };

  const activeLabel = FOOTER_TABS.find((tab) => tab.id === activeTab)?.label ?? '';

  return (
    <div className="md:hidden mt-10">
      <div
        role="tablist"
        aria-label="Footer sections"
        className="grid grid-cols-3 border-b border-white/10"
      >
        {FOOTER_TABS?.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const isSelected = isActive && isOpen;

          return (
            <button
              key={tab.id}
              id={`footer-tab-${tab.id}`}
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-expanded={isSelected}
              aria-controls="footer-tabpanel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabClick(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`relative flex min-h-[44px] items-center justify-center rounded-t-lg px-1 pb-3 pt-2 text-center text-[11px] font-bold uppercase leading-tight tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C200]/70 ${
                isActive ? 'text-[#F5C200]' : 'text-white/65 hover:text-white'
              }`}
            >
              {tab.label}
              <span
                aria-hidden="true"
                className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#F5C200] transition-all duration-300 ease-out ${
                  isSelected ? 'scale-x-100 opacity-100' : 'scale-x-50 opacity-0'
                }`}
              />
            </button>
          );
        })}
      </div>

      <div
        id="footer-tabpanel"
        role="tabpanel"
        aria-labelledby={`footer-tab-${activeTab}`}
        inert={!isOpen}
        style={{ height: isOpen ? (panelHeight ?? undefined) : 0 }}
        className={`overflow-hidden transition-[height,opacity] duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div ref={contentRef} className="px-2 pb-1 pt-6 text-center">
          <h4 className="font-bold text-sm tracking-widest uppercase text-[#F5C200] mb-4">
            {activeLabel}
          </h4>
          {activeTab === 'services' ? <ServicesList linkClassName="inline-block py-1" /> : null}
          {activeTab === 'quick-links' ? (
            <QuickLinksList linkClassName="inline-block py-1" />
          ) : null}
          {activeTab === 'contact' ? <ContactList centered /> : null}
        </div>
      </div>
    </div>
  );
}

export default function PublicFooter() {
  return (
    <footer className="bg-[#1A0A5E] text-white">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5 mb-4">
              <AppLogo width={196} height={52} showWordmark tone="dark" />
            </div>
            <p className="text-sm text-white/65 leading-relaxed mb-5">
              Otukpo&apos;s most reliable on-demand laundry, home cleaning and fumigation service.
              Delivered to you clean, crisp, and right on time.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <a
                href="https://wa.me/2347052258764"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#25D366] flex items-center justify-center transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle size={18} />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#E1306C] flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon size={18} />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#1877F2] flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon size={18} />
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="hidden md:block">
            <h4 className="font-bold text-sm tracking-widest uppercase text-[#F5C200] mb-4">
              Services
            </h4>
            <ServicesList />
          </div>

          {/* Quick Links */}
          <div className="hidden md:block">
            <h4 className="font-bold text-sm tracking-widest uppercase text-[#F5C200] mb-4">
              Quick Links
            </h4>
            <QuickLinksList />
          </div>

          {/* Contact */}
          <div className="hidden md:block">
            <h4 className="font-bold text-sm tracking-widest uppercase text-[#F5C200] mb-4">
              Contact Us
            </h4>
            <ContactList />
          </div>
        </div>

        {/* Phone-only collapsible version of the three lists above */}
        <MobileFooterTabs />

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40 text-center md:text-left">
            © 2026 247Sparkle Laundry & Cleaning Services. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:gap-6">
            <Link href="/" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              Terms of Service
            </Link>
            <Link href="/" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
