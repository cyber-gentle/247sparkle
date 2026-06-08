import React from 'react';
import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 'testimonial-chidinma',
    name: 'Chidinma Okonkwo',
    role: 'Marketing Manager, Victoria Island',
    rating: 5,
    text: 'I&apos;ve been using 247 Sparkle for 6 months now and they never disappoint. My Agbada and lace outfits come back perfectly pressed. The real-time tracking is a game-changer — I know exactly when my rider is coming.',
    avatar: 'CO',
    avatarBg: 'bg-[#F5C200]',
    avatarText: 'text-[#1A0A5E]',
  },
  {
    id: 'testimonial-emeka',
    name: 'Emeka Adeyemi',
    role: 'Software Engineer, Lekki Phase 1',
    rating: 5,
    text: 'As someone with a very busy schedule, 247 Sparkle has been a lifesaver. Booked online, they picked up from my gate, and delivered back within 48 hours. The fumigation service was also thorough — got the certificate the same day.',
    avatar: 'EA',
    avatarBg: 'bg-[#1A0A5E]',
    avatarText: 'text-white',
  },
  {
    id: 'testimonial-fatima',
    name: 'Fatima Bello-Usman',
    role: 'Business Owner, Ikeja',
    rating: 5,
    text: 'We use 247 Sparkle for our office cleaning every week. Professional, punctual, and they bring all their own equipment. Our office has never looked better. I highly recommend them to any Otukpo business owner.',
    avatar: 'FB',
    avatarBg: 'bg-[#CC0000]',
    avatarText: 'text-white',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs font-bold tracking-widest uppercase text-[#CC0000] mb-3 block">
            Customer Reviews
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-[#1A0A5E] mb-4">
            What Otukpo is Saying
          </h2>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5]?.map((s) => (
              <Star key={`rating-star-${s}`} size={20} fill="#F5C200" className="text-[#F5C200]" />
            ))}
            <span className="ml-2 text-sm font-bold text-gray-700">4.8/5</span>
          </div>
          <p className="text-gray-400 text-sm">Based on 340+ verified reviews</p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS?.map((t) => (
            <div key={t?.id} className="public-card public-card-hover flex flex-col p-6">
              {/* Quote Icon */}
              <div className="mb-4">
                <Quote size={28} className="text-[#F5C200]" />
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t?.rating })?.map((_, si) => (
                  <Star
                    key={`${t?.id}-star-${si + 1}`}
                    size={14}
                    fill="#F5C200"
                    className="text-[#F5C200]"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-6">{t?.text}</p>

              {/* Author */}
              <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                <div
                  className={`w-10 h-10 rounded-full ${t?.avatarBg} ${t?.avatarText} flex items-center justify-center text-sm font-bold`}
                >
                  {t?.avatar}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1A0A5E]">{t?.name}</div>
                  <div className="text-xs text-gray-400">{t?.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
