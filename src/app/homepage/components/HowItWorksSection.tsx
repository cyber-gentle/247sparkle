import React from 'react';
import { PackageSearch, CalendarCheck, Truck } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const STEPS = [
  {
    id: 'step-choose',
    number: '01',
    icon: PackageSearch,
    title: 'Choose Your Service',
    description: 'Select from Laundry, Home Cleaning, Office Cleaning, or Fumigation. Pick your items and quantities — we handle the rest.',
    color: 'bg-[#F5C200]',
    textColor: 'text-[#1A0A5E]',
  },
  {
    id: 'step-schedule',
    number: '02',
    icon: CalendarCheck,
    title: 'Schedule Pickup or Drop-off',
    description: 'Choose a convenient pickup time from your address, or drop your laundry at a nearby partner shop. We arrive on time, every time.',
    color: 'bg-[#1A0A5E]',
    textColor: 'text-white',
  },
  {
    id: 'step-deliver',
    number: '03',
    icon: Truck,
    title: 'We Clean & Deliver Back to You',
    description: 'Your items are professionally cleaned and delivered back to your door — fresh, folded, and right on time. Track every step in real time.',
    color: 'bg-[#CC0000]',
    textColor: 'text-white',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs font-bold tracking-widest uppercase text-[#CC0000] mb-3 block">Simple Process</span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-[#1A0A5E] mb-4">
            How 247 Sparkle Works
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
            Getting your laundry done has never been easier. Three steps, zero stress, complete peace of mind.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-[calc(16.7%+2rem)] right-[calc(16.7%+2rem)] h-px bg-gradient-to-r from-[#F5C200] via-[#1A0A5E] to-[#CC0000] z-0" />

          {STEPS?.map((step) => {
            const Icon = step?.icon;
            return (
              <div key={step?.id} className="relative z-10 flex flex-col items-center text-center group">
                {/* Icon Circle */}
                <div
                  className={`w-20 h-20 rounded-2xl ${step?.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform duration-300`}
                >
                  <Icon size={32} className={step?.textColor} />
                </div>
                {/* Number */}
                <span className="text-xs font-bold tracking-widest text-gray-300 mb-2 uppercase">
                  Step {step?.number}
                </span>
                {/* Title */}
                <h3 className="text-xl font-bold text-[#1A0A5E] mb-3">{step?.title}</h3>
                {/* Description */}
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{step?.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}