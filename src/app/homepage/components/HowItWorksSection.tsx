import React from 'react';
import { PackageSearch, CalendarCheck, Truck, Sparkles, CreditCard, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    id: 'step-choose',
    number: '01',
    icon: PackageSearch,
    title: 'Choose Your Service',
    description:
      'Select from Laundry, Home Cleaning, Office Cleaning, or Fumigation. Pick your items, quantities, and preferences.',
    color: 'bg-[#F5C200]',
    textColor: 'text-[#1A0A5E]',
  },
  {
    id: 'step-schedule',
    number: '02',
    icon: CalendarCheck,
    title: 'Schedule Pickup',
    description:
      'Choose a convenient pickup time from your address. We offer flexible scheduling to fit your busy lifestyle.',
    color: 'bg-[#1A0A5E]',
    textColor: 'text-white',
  },
  {
    id: 'step-delivery',
    number: '03',
    icon: Truck,
    title: 'We Pick Up Your Items',
    description:
      'Our professional rider picks up your items right from your door. Track them in real-time on our app or website.',
    color: 'bg-[#CC0000]',
    textColor: 'text-white',
  },
  {
    id: 'step-process',
    number: '04',
    icon: Sparkles,
    title: 'Professional Processing',
    description:
      'Your items are handled with care using industry-leading equipment and eco-friendly products. Quality guaranteed.',
    color: 'bg-[#059669]',
    textColor: 'text-white',
  },
  {
    id: 'step-payment',
    number: '05',
    icon: CreditCard,
    title: 'Secure Payment',
    description:
      'Pay safely via Paystack. We send you an invoice before delivery. No surprises, no hidden charges.',
    color: 'bg-[#F5C200]',
    textColor: 'text-[#1A0A5E]',
  },
  {
    id: 'step-delivery-done',
    number: '06',
    icon: CheckCircle,
    title: 'Fresh Delivery',
    description:
      'Your perfectly cleaned, folded items arrive at your door on time, every time. Sit back and enjoy the convenience.',
    color: 'bg-[#1A0A5E]',
    textColor: 'text-white',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs font-bold tracking-widest uppercase text-[#CC0000] mb-3 block">
            Simple Process
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-[#1A0A5E] mb-4">
            How 247 Sparkle Works
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
            Getting your laundry done has never been easier. Three steps, zero stress, complete
            peace of mind.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 relative">
          {/* Connector line */}
          <div className="hidden xl:block absolute top-16 left-[calc(8.3%+2rem)] right-[calc(8.3%+2rem)] h-px bg-gradient-to-r from-[#F5C200] via-[#1A0A5E] via-[#CC0000] to-[#059669] z-0" />

          {STEPS?.map((step) => {
            const Icon = step?.icon;
            return (
              <div
                key={step?.id}
                className="public-card public-card-hover relative z-10 flex flex-col items-center p-4 text-center group"
              >
                {/* Icon Circle */}
                <div
                  className={`w-16 h-16 rounded-xl ${step?.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300`}
                >
                  <Icon size={28} className={step?.textColor} />
                </div>
                {/* Number */}
                <span className="text-xs font-bold tracking-widest text-gray-300 mb-2 uppercase">
                  Step {step?.number}
                </span>
                {/* Title */}
                <h3 className="text-base font-bold text-[#1A0A5E] mb-2">{step?.title}</h3>
                {/* Description */}
                <p className="text-gray-500 text-xs leading-relaxed max-w-xs">
                  {step?.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
