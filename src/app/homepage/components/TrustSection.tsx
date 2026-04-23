import React from 'react';
import { Shield, Truck, Lock, MapPin, Clock, Award } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


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
    description: '98% of orders delivered within the promised time window. We respect your schedule.',
  },
  {
    id: 'trust-secure',
    icon: Lock,
    title: 'Secure Payments',
    description: 'Pay safely via Paystack — Nigeria\'s most trusted payment gateway. No cash required.',
  },
];

export default function TrustSection() {
  return (
    <section className="py-20 lg:py-28 bg-[#1A0A5E]">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs font-bold tracking-widest uppercase text-[#F5C200] mb-3 block">Why Choose Us</span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white mb-4">
            The 247 Sparkle Promise
          </h2>
          <p className="text-white/60 max-w-xl mx-auto text-base leading-relaxed">
            We built 247 Sparkle on one principle: you deserve service you can trust, every single time.
          </p>
        </div>

        {/* Trust Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRUST_ITEMS?.map((item) => {
            const Icon = item?.icon;
            return (
              <div
                key={item?.id}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 group transition-all duration-300 hover:-translate-y-1"
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