import React from 'react';
import Link from 'next/link';
import { Store, Bike, ArrowRight, TrendingUp } from 'lucide-react';

export default function PartnerBanner() {
  return (
    <section id="partner" className="py-20 lg:py-28 bg-white">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Main Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A0A5E] to-[#2D1B8E] p-10 lg:p-16 mb-10">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#F5C200]/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-20 w-48 h-48 bg-[#CC0000]/10 rounded-full translate-y-1/3" />

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-[#F5C200]/20 border border-[#F5C200]/30 rounded-full px-4 py-1.5 mb-6">
              <TrendingUp size={14} className="text-[#F5C200]" />
              <span className="text-[#F5C200] text-xs font-bold tracking-widest uppercase">
                Join Our Network
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white mb-4 max-w-3xl mx-auto leading-tight">
              Grow Your Revenue with <span className="text-[#F5C200]">247 Sparkle</span>
            </h2>
            <p className="text-white/70 text-base lg:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Are you a laundry business or looking to earn as a delivery rider in Otukpo? Join our
              growing network and access a steady stream of customers from day one.
            </p>

            {/* Two Partner Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Laundry Business */}
              <div className="group rounded-2xl border border-white/20 bg-white/10 p-6 text-left shadow-[0_18px_45px_rgba(0,0,0,0.14)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/15">
                <div className="w-12 h-12 rounded-xl bg-[#F5C200] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Store size={22} className="text-[#1A0A5E]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Register as a Laundry Business
                </h3>
                <p className="text-white/60 text-sm mb-5 leading-relaxed">
                  List your shop on the 247 Sparkle platform. We send you overflow orders and handle
                  customer acquisition — you focus on cleaning.
                </p>
                <Link
                  href="/partner/signup"
                  className="inline-flex items-center gap-2 bg-[#F5C200] text-[#1A0A5E] font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#E6B000] active:scale-95 transition-all"
                >
                  Register as Partner
                  <ArrowRight size={15} />
                </Link>
              </div>

              {/* Rider */}
              <div className="group rounded-2xl border border-white/20 bg-white/10 p-6 text-left shadow-[0_18px_45px_rgba(0,0,0,0.14)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/15">
                <div className="w-12 h-12 rounded-xl bg-[#CC0000] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Bike size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Register as a Rider</h3>
                <p className="text-white/60 text-sm mb-5 leading-relaxed">
                  Earn money on your own schedule. Pick up and deliver laundry orders across Otukpo.
                  Earn 20% commission on every completed delivery.
                </p>
                <Link
                  href="/rider/signup"
                  className="inline-flex items-center gap-2 bg-[#CC0000] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#AA0000] active:scale-95 transition-all"
                >
                  Register as Rider
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
