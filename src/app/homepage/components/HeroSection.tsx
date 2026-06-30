'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { ArrowRight, ChevronDown, Star, MapPin } from 'lucide-react';

const HERO_STATS = [
  { value: 2400, suffix: '+', label: 'Orders Delivered' },
  { value: 98, suffix: '%', label: 'Satisfaction Rate' },
  { value: 4.8, suffix: '★', label: 'Customer Rating', decimals: 1 },
];

function CountUpNumber({
  value,
  suffix = '',
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    const duration = 1400;
    const start = performance.now();
    let frameId = 0;

    function animate(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    }

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  const formatted =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toLocaleString('en-US');

  return (
    <>
      {formatted}
      {suffix}
    </>
  );
}

export default function HeroSection() {
  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <AppImage
          src="/images/bg-image.jpeg"
          alt="Modern laundry room with washing machines and clean folded clothes"
          fill
          priority
          className="object-contain object-right-top translate-y-10 md:translate-y-6 bg-[#0f1634]"
          sizes="100vw"
        />

        <div className="absolute inset-0 gradient-hero" />
        {/* Gold accent overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1A0A5E]/90 to-transparent" />
      </div>
      {/* Decorative elements */}
      <div className="absolute top-32 right-10 lg:right-20 z-10 hidden lg:block">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 w-52">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/80 text-xs font-semibold">Live Tracking Active</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-[#F5C200]" />
            <span className="text-white text-xs">3 riders near you</span>
          </div>
        </div>
      </div>
      <div className="absolute top-48 right-10 lg:right-24 z-10 hidden lg:block mt-24">
        <div className="bg-[#F5C200]/95 rounded-2xl p-4 w-48 shadow-gold">
          <div className="flex items-center gap-1 mb-1">
            {[1, 2, 3, 4, 5]?.map((s) => (
              <Star key={`hero-star-${s}`} size={12} fill="#1A0A5E" className="text-[#1A0A5E]" />
            ))}
          </div>
          <p className="text-[#1A0A5E] text-xs font-semibold leading-snug">
            &quot;My clothes came back better than dry-clean!&quot;
          </p>
          <p className="text-[#1A0A5E]/60 text-[10px] mt-1 font-medium">— Adaeze O., Otukpo</p>
        </div>
      </div>
      {/* Main Content */}
      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 lg:px-10 pt-24 pb-16 w-full">
        <div className="max-w-3xl">
          {/* Label */}
          <div className="inline-flex items-center gap-2 bg-[#F5C200]/20 border border-[#F5C200]/30 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#F5C200] animate-pulse" />
            <span className="text-[#F5C200] text-xs font-bold tracking-widest uppercase">
              Otukpo&apos;s #1 On-Demand Service
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight mb-6 text-balance">
            Pristine Laundry &amp; Cleaning <span className="text-[#F5C200]">Delivered Fresh.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-8 max-w-2xl">
            Skip the hassle. Our professional laundry, home cleaning, and fumigation services come to you with real-time tracking, flexible scheduling, and unbeatable care for your belongings.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link
              href="/customer/signup"
              className="inline-flex items-center justify-center gap-2 bg-[#F5C200] text-[#1A0A5E] font-bold px-8 py-4 rounded-xl text-base hover:bg-[#E6B000] active:scale-95 transition-all duration-150 shadow-gold"
            >
              Book a Service
              <ArrowRight size={18} />
            </Link>
            <button
              onClick={scrollToHowItWorks}
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white font-bold px-8 py-4 rounded-xl text-base hover:bg-white/10 active:scale-95 transition-all duration-150 backdrop-blur-sm"
            >
              How It Works
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8">
            {HERO_STATS?.map((stat) => (
              <div
                key={`hero-stat-${stat?.label?.toLowerCase()?.replace(/\s+/g, '-')}`}
                className="text-center"
              >
                <div className="min-w-[4.75rem] text-2xl font-extrabold text-[#F5C200] font-mono-nums">
                  <CountUpNumber value={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
                </div>
                <div className="text-xs text-white/60 font-medium mt-0.5">{stat?.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Scroll indicator */}
      <button
        onClick={scrollToHowItWorks}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors"
        aria-label="Scroll to services"
      >
        <span className="text-xs font-medium tracking-widest uppercase">Explore</span>
        <ChevronDown size={20} className="animate-bounce" />
      </button>
    </section>
  );
}
