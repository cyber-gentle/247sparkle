'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { Menu, X, Phone, MessageCircle } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Become a Partner', href: '/become-a-partner' },
  { label: 'Contact', href: '/contact' },
];

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const solidNavbar = scrolled || pathname !== '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          solidNavbar ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <AppLogo width={140} height={50} src="/images/logo.jpeg" className={solidNavbar ? "mix-blend-multiply" : "rounded-lg"} />
              <div className="flex flex-col leading-none">
                <span
                  className={`font-extrabold text-xl tracking-tight transition-colors ${solidNavbar ? 'text-[#1A0A5E]' : 'text-white'}`}
                >
                  <span className="text-[#F5C200]">247</span>
                  <span className="text-[#CC0000]"> Sparkle</span>
                </span>
                <span
                  className={`text-[10px] font-medium tracking-widest uppercase transition-colors ${solidNavbar ? 'text-gray-500' : 'text-white/70'}`}
                >
                  Laundry & Cleaning
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS?.map((link) => (
                <Link
                  key={`nav-${link?.label?.toLowerCase()?.replace(/\s+/g, '-')}`}
                  href={link?.href}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 hover:bg-white/10 ${
                    solidNavbar
                      ? 'text-[#1A0A5E] hover:bg-[#1A0A5E]/5'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {link?.label}
                </Link>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              <a
                href="https://wa.me/2347052258764"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                  solidNavbar
                    ? 'text-gray-600 hover:text-[#25D366]'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>
              <Link
                href="/customer/signup"
                className="bg-[#F5C200] text-[#1A0A5E] font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#E6B000] active:scale-95 transition-all duration-150 shadow-gold"
              >
                Book Now
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                solidNavbar ? 'text-[#1A0A5E] hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden transition-all duration-300 overflow-hidden ${
            mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          } bg-white border-t border-gray-100 shadow-lg`}
        >
          <div className="px-6 py-4 flex flex-col gap-1">
            {NAV_LINKS?.map((link) => (
              <Link
                key={`mobile-nav-${link?.label?.toLowerCase()?.replace(/\s+/g, '-')}`}
                href={link?.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-lg text-sm font-semibold text-[#1A0A5E] hover:bg-[#F5C200]/10 transition-colors"
              >
                {link?.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              <a
                href="tel:09039661885"
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-600"
              >
                <Phone size={16} />
                09039661885
              </a>
              <Link
                href="/customer/signup"
                onClick={() => setMobileOpen(false)}
                className="bg-[#F5C200] text-[#1A0A5E] font-bold px-5 py-3 rounded-xl text-sm text-center hover:bg-[#E6B000] transition-all"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
