'use client';
import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle } from 'lucide-react';

export default function FloatingActionButtons() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* WhatsApp Button */}
      <a
        href="https://wa.me/2347052258764"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20BA58] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 group"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={24} className="text-white" />
        <span className="absolute right-20 bg-black/80 text-white text-sm font-semibold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Chat with us
        </span>
      </a>

      {/* Phone Button */}
      <a
        href="tel:09039661885"
        className="flex items-center justify-center w-14 h-14 bg-[#1A0A5E] hover:bg-[#2d1a75] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 group"
        aria-label="Call us"
      >
        <Phone size={24} className="text-white" />
        <span className="absolute right-20 bg-black/80 text-white text-sm font-semibold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Call us
        </span>
      </a>
    </div>
  );
}
