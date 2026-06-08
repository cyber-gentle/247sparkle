import React from 'react';
import AppImage from '@/components/ui/AppImage';
import { CheckCircle2 } from 'lucide-react';

const ABOUT_POINTS = [
'Consistent quality with attention to every detail',
'Effective cleaning methods that keep fabrics long-lasting',
'Trusted by thousands of Otukpo families and professionals',
'Indigenous Nigerian brand built for local needs'];


export default function AboutSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Image */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-navy">
              <AppImage
                src="/images/equipments.jpeg"
                alt="247 Sparkle professional cleaning equipment including blue bucket and cleaning supplies"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw" />

            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 bg-[#F5C200] rounded-2xl p-4 shadow-gold">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-[#1A0A5E] font-mono-nums">247</div>
                <div className="text-[10px] font-bold text-[#1A0A5E] tracking-widest uppercase">Always Open</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-[#CC0000] mb-3 block">About Us</span>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-[#1A0A5E] mb-6 leading-tight">
              Proudly Indigenous.{' '}
              <span className="text-[#CC0000]">Reliably Excellent.</span>
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                247 Sparkle is a proudly indigenous brand committed to delivering reliable, high-quality laundry and apartment cleaning solutions tailored to your everyday needs. We understand the demands of busy schedules, which is why we provide seamless washing, professional cleaning, and convenient pick-up and delivery services designed to save you time and effort.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Our approach is simple: consistent quality, attention to detail, and customer satisfaction at every touchpoint. Whether it&apos;s your daily wear, office outfits, or special fabrics, we handle every item with care, using effective cleaning methods that keep your clothes fresh, spotless, and long-lasting.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                With 247 Sparkle, you don&apos;t just get a service — you get peace of mind, knowing your laundry is in trusted hands, delivered back to you clean, crisp, and right on time.
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {ABOUT_POINTS?.map((point) =>
              <li key={`about-point-${point?.substring(0, 20)?.toLowerCase()?.replace(/\s+/g, '-')}`} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-[#F5C200] shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600 font-medium">{point}</span>
                </li>
              )}
            </ul>

            <div className="flex flex-wrap gap-4">
              <a
                href="tel:09039661885"
                className="inline-flex items-center gap-2 bg-[#1A0A5E] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#2D1B8E] transition-all duration-150 active:scale-95">

                Call Us Now
              </a>
              <a
                href="https://wa.me/2347052258764"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#1da851] transition-all duration-150 active:scale-95">

                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>);

}
