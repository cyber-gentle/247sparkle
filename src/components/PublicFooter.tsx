import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

export default function PublicFooter() {
  return (
    <footer className="bg-[#1A0A5E] text-white">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <AppLogo size={44} src="/assets/images/logo-1776946823352.jpeg" />
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-xl">
                  <span className="text-[#F5C200]">247</span>
                  <span className="text-[#CC0000]"> Sparkle</span>
                </span>
                <span className="text-[10px] font-medium tracking-widest uppercase text-white/50">
                  Laundry & Cleaning
                </span>
              </div>
            </div>
            <p className="text-sm text-white/65 leading-relaxed mb-5">
              Lagos&apos;s most reliable on-demand laundry, home cleaning and fumigation service. Delivered to you clean, crisp, and right on time.
            </p>
            <div className="flex items-center gap-3">
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
          <div>
            <h4 className="font-bold text-sm tracking-widest uppercase text-[#F5C200] mb-4">Services</h4>
            <ul className="space-y-2.5">
              {['Laundry', 'Home Cleaning', 'Office Cleaning', 'Fumigation', 'Pickup & Delivery']?.map((s) => (
                <li key={`footer-service-${s?.toLowerCase()?.replace(/\s+/g, '-')}`}>
                  <Link href="/services" className="text-sm text-white/65 hover:text-white transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm tracking-widest uppercase text-[#F5C200] mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Book a Service', href: '/customer/signup' },
                { label: 'Track Your Order', href: '/customer/orders' },
                { label: 'Become a Partner', href: '/become-a-partner' },
                { label: 'Verify Certificate', href: '/verify' },
                { label: 'Admin Login', href: '/admin/login' },
              ]?.map((link) => (
                <li key={`footer-link-${link?.label?.toLowerCase()?.replace(/\s+/g, '-')}`}>
                  <Link href={link?.href} className="text-sm text-white/65 hover:text-white transition-colors">
                    {link?.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm tracking-widest uppercase text-[#F5C200] mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-white/65">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#F5C200]" />
                Lagos, Nigeria
              </li>
              <li>
                <a href="tel:09039661885" className="flex items-center gap-2.5 text-sm text-white/65 hover:text-white transition-colors">
                  <Phone size={16} className="shrink-0 text-[#F5C200]" />
                  09039661885
                </a>
              </li>
              <li>
                <a href="tel:07052258764" className="flex items-center gap-2.5 text-sm text-white/65 hover:text-white transition-colors">
                  <Phone size={16} className="shrink-0 text-[#F5C200]" />
                  07052258764 (WhatsApp)
                </a>
              </li>
              <li>
                <a href="mailto:info.247sparkle@gmail.com" className="flex items-center gap-2.5 text-sm text-white/65 hover:text-white transition-colors">
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
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            © 2026 247 Sparkle Laundry & Cleaning Services. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xs text-white/40 hover:text-white/70 transition-colors">Privacy Policy</Link>
            <Link href="/" className="text-xs text-white/40 hover:text-white/70 transition-colors">Terms of Service</Link>
            <Link href="/" className="text-xs text-white/40 hover:text-white/70 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
