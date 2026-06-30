import React from 'react';
import Link from 'next/link';
import { PlusCircle, MapPin, FileText, Phone, MessageCircle } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const ACTIONS = [
  {
    id: 'action-new-order',
    icon: PlusCircle,
    label: 'New Order',
    sub: 'Book laundry or cleaning',
    href: '/customer-dashboard',
    bg: 'bg-[#F5C200]',
    text: 'text-[#1A0A5E]',
    subText: 'text-[#1A0A5E]/70',
  },
  {
    id: 'action-track',
    icon: MapPin,
    label: 'Track Order',
    sub: 'Live rider location',
    href: '/customer-dashboard',
    bg: 'bg-[#1A0A5E]',
    text: 'text-white',
    subText: 'text-white/60',
  },
  {
    id: 'action-certs',
    icon: FileText,
    label: 'My Certificates',
    sub: 'Download fumigation certs',
    href: '/customer-dashboard',
    bg: 'bg-green-600',
    text: 'text-white',
    subText: 'text-white/60',
  },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <h3 className="text-sm font-bold text-[#1A0A5E] mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {ACTIONS?.map((action) => {
          const Icon = action?.icon;
          return (
            <Link
              key={action?.id}
              href={action?.href}
              className={`flex items-center gap-3 p-4 rounded-xl ${action?.bg} hover:opacity-90 active:scale-98 transition-all duration-150 group`}
            >
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Icon size={18} className={action?.text} />
              </div>
              <div>
                <div className={`text-sm font-bold ${action?.text}`}>{action?.label}</div>
                <div className={`text-xs ${action?.subText}`}>{action?.sub}</div>
              </div>
            </Link>
          );
        })}
      </div>
      {/* Support */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Need Help?</p>
        <div className="flex gap-2">
          <a
            href="tel:09039661885"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:border-[#1A0A5E] hover:text-[#1A0A5E] transition-colors"
          >
            <Phone size={13} />
            Call Us
          </a>
          <a
            href="https://wa.me/2347052258764"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#1da851] transition-colors"
          >
            <MessageCircle size={13} />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}