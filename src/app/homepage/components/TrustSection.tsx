import React from 'react';
import { Shield, Truck, Lock, MapPin, Clock, Award } from 'lucide-react';

const TRUST_ITEMS = [
  {
    id: 'trust-licensed',
    icon: Award,
    title: 'Licensed & Certified',
    description: 'All our cleaners and fumigation teams are licensed, trained, and certified.',
  },
  {
    id: 'trust-pickup',
    icon: Truck,
    title: 'Pickup & Delivery',
    description: 'We come to you — free pickup and doorstep delivery on all laundry orders.',
  },
  {
    id: 'trust-insured',
    icon: Shield,
    title: 'Insured Items',
    description: 'Every item in our care is insured. We handle your clothes like they are our own.',
  },
  {
    id: 'trust-tracking',
    icon: MapPin,
    title: 'Real-time Tracking',
    description: 'Track your rider on a live map from pickup to delivery, every step of the way.',
  },
  {
    id: 'trust-time',
    icon: Clock,
    title: 'On-time, Every Time',
    description:
      '98% of orders delivered within the promised time window. We respect your schedule.',
  },
  {
    id: 'trust-secure',
    icon: Lock,
    title: 'Secure Payments',
    description:
      "Pay safely via Paystack — Nigeria's most trusted payment gateway. No cash required.",
  },
];

export default function TrustSection() {
  return (
    <section className="py-20 lg:py-28 bg-[#1A0A5E]">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-widest uppercase text-[#F5C200] mb-3 block">
            Why Choose Us
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white mb-4">
            The 247 Sparkle Difference
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto text-base leading-relaxed">
            We&apos;re not just a cleaning service—we&apos;re your trusted partner in maintaining a clean, healthy, and organized life. Here&apos;s what makes us different.
          </p>
        </div>

        {/* Trust Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRUST_ITEMS?.map((item) => {
            const Icon = item?.icon;
            return (
              <div
                key={item?.id}
                className="group rounded-2xl border border-white/15 bg-white/[0.07] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 hover:bg-white/10"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F5C200] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon size={22} className="text-[#1A0A5E]" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{item?.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{item?.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
