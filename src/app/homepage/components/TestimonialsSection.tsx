import React from 'react';
import { Quote, Star } from 'lucide-react';

// Placeholder reviews per the brief ("Testimonials: 3 placeholder customer
// reviews"). Swap in real quotes as customers provide them.
const TESTIMONIALS = [
  {
    id: 'testimonial-adaeze',
    name: 'Adaeze O.',
    location: 'Otukpo, Benue State',
    initials: 'AO',
    rating: 5,
    quote:
      'The pickup rider arrived within my chosen time window and my clothes came back crisp and fresh. Tracking the delivery on the map felt like ordering a ride — brilliant!',
    service: 'Laundry',
  },
  {
    id: 'testimonial-ogbaje',
    name: 'Ogbaje I.',
    location: 'GRA, Otukpo',
    initials: 'OI',
    rating: 5,
    quote:
      'We booked the full-home fumigation before moving in. The team was thorough, on time, and the verifiable certificate gave our landlord complete peace of mind.',
    service: 'Fumigation',
  },
  {
    id: 'testimonial-mrs-ochanya',
    name: 'Mrs. Ochanya A.',
    location: 'Upu Road, Otukpo',
    initials: 'OA',
    rating: 5,
    quote:
      'Two kids, a busy clinic, and zero time to scrub. The deep cleaning team transformed my kitchen and bathrooms in one afternoon. I have rebooked every month since.',
    service: 'Home Cleaning',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-slate-50">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-widest uppercase text-[#CC0000] mb-3 block">
            Testimonials
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-[#1A0A5E] mb-4">
            Otukpo Trusts 247Sparkle
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
            Real words from our neighbours. We&apos;re proud to serve homes and businesses across
            Benue State.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial) => (
            <figure
              key={testimonial.id}
              className="group relative bg-white rounded-2xl border border-slate-100 shadow-card p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <Quote
                size={28}
                className="text-[#F5C200] mb-4"
                fill="#F5C200"
                strokeWidth={0}
                aria-hidden="true"
              />
              <blockquote className="text-sm text-slate-600 leading-relaxed flex-1">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#1A0A5E] flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {testimonial.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    {Array.from({ length: testimonial.rating }, (_, i) => i + 1).map((s) => (
                      <Star
                        key={s}
                        size={11}
                        fill="#F5C200"
                        className="text-[#F5C200]"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="text-sm font-bold text-[#1A0A5E] truncate">{testimonial.name}</p>
                  <p className="text-xs text-slate-400 truncate">{testimonial.location}</p>
                </div>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-[#F5C200]/15 text-[#1A0A5E] px-2 py-1 rounded-full shrink-0">
                  {testimonial.service}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
