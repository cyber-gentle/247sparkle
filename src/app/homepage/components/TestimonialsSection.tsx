'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, Loader2, Quote, Star } from 'lucide-react';
import { toast } from 'sonner';

// Real, admin-approved customer testimonials fetched from /api/testimonials.
// Until one is approved the section shows only the submission invitation —
// no placeholder reviews.
interface Testimonial {
  id: string;
  name: string;
  location?: string | null;
  service: string;
  rating: number;
  quote: string;
}

const SERVICE_LABELS: Record<string, string> = {
  LAUNDRY: 'Laundry',
  HOME_CLEANING: 'Home Cleaning',
  OFFICE_CLEANING: 'Office Cleaning',
  FUMIGATION: 'Fumigation',
};

const VISIBLE_COUNT = 2;

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="group relative bg-white rounded-2xl border border-slate-100 shadow-card p-5 md:p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
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
          {testimonial.name
            .split(' ')
            .map((part) => part[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
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
          {SERVICE_LABELS[testimonial.service] ?? testimonial.service}
        </span>
      </figcaption>
    </figure>
  );
}

function SubmitForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [form, setForm] = useState({
    name: '',
    location: '',
    service: 'LAUNDRY',
    quote: '',
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rating,
          location: form.location.trim() || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error === 'Validation failed'
            ? 'Please check your details and try again.'
            : data.error || 'Submission failed'
        );
      }

      toast.success('Thank you! Your testimony is awaiting review.');
      onSubmitted();
    } catch (error: any) {
      toast.error(error.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 md:p-6 max-w-2xl mx-auto space-y-4 text-left"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#1A0A5E] focus:ring-4 focus:ring-[#1A0A5E]/10"
          required
          minLength={2}
          maxLength={80}
        />
        <input
          type="text"
          placeholder="Your area (e.g. Upu Road, Otukpo)"
          value={form.location}
          onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#1A0A5E] focus:ring-4 focus:ring-[#1A0A5E]/10"
          maxLength={100}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={form.service}
          onChange={(e) => setForm((prev) => ({ ...prev, service: e.target.value }))}
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm bg-white outline-none focus:border-[#1A0A5E] focus:ring-4 focus:ring-[#1A0A5E]/10"
          aria-label="Service used"
        >
          <option value="LAUNDRY">Laundry</option>
          <option value="HOME_CLEANING">Home Cleaning</option>
          <option value="OFFICE_CLEANING">Office Cleaning</option>
          <option value="FUMIGATION">Fumigation</option>
        </select>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} star${value === 1 ? '' : 's'}`}
              onClick={() => setRating(value)}
              className="p-0.5"
            >
              <Star
                size={20}
                className={value <= rating ? 'text-[#F5C200]' : 'text-slate-300'}
                fill={value <= rating ? '#F5C200' : 'none'}
              />
            </button>
          ))}
        </div>
      </div>
      <textarea
        placeholder="Tell others about your experience (at least 10 characters)"
        rows={4}
        value={form.quote}
        onChange={(e) => setForm((prev) => ({ ...prev, quote: e.target.value }))}
        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#1A0A5E] focus:ring-4 focus:ring-[#1A0A5E]/10"
        required
        minLength={10}
        maxLength={600}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1A0A5E] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#120843] disabled:opacity-50 transition-colors"
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        {isSubmitting ? 'Submitting...' : 'Share Your Testimony'}
      </button>
    </form>
  );
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[] | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/testimonials')
      .then((res) => (res.ok ? res.json() : { testimonials: [] }))
      .then((data) => {
        if (!cancelled) setTestimonials(data.testimonials ?? []);
      })
      .catch(() => {
        if (!cancelled) setTestimonials([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Still loading — reserve nothing and render nothing to avoid layout shift
  // between the invitation state and cards.
  if (testimonials === null) return null;

  const initialTestimonials = testimonials.slice(0, VISIBLE_COUNT);
  const hiddenTestimonials = testimonials.slice(VISIBLE_COUNT);
  const hiddenCount = hiddenTestimonials.length;
  const hasMore = hiddenCount > 0;
  const isEmpty = testimonials.length === 0;

  const expandLabel = `See ${hiddenCount} more ${hiddenCount === 1 ? 'testimony' : 'testimonies'}`;

  return (
    <section className="py-12 sm:py-20 lg:py-28 bg-slate-50">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14 lg:mb-16">
          <span className="text-xs font-bold tracking-widest uppercase text-[#CC0000] mb-3 block">
            Testimonials
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-[#1A0A5E] mb-3 md:mb-4">
            Otukpo Trusts 247Sparkle
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            {isEmpty
              ? 'Have you used our services? Your experience can help a neighbour choose with confidence — be the first to share it.'
              : 'Real words from the people we serve, in their own words, shared with their permission.'}
          </p>
        </div>

        {isEmpty ? (
          /* No approved testimonials yet — invite the first one directly. */
          <SubmitForm onSubmitted={() => setIsFormOpen(false)} />
        ) : (
          <>
            {/* Testimonial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {initialTestimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>

            {hasMore ? (
              <>
                {/* Revealed cards. The 0fr -> 1fr grid trick gives a smooth,
                    pure-CSS height transition while keeping the same column rhythm. */}
                <div
                  id="testimonials-more"
                  className={`grid transition-all duration-500 ease-out ${
                    isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                  inert={!isExpanded}
                >
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                      {hiddenTestimonials.map((testimonial) => (
                        <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsExpanded((previous) => !previous)}
                    aria-expanded={isExpanded}
                    aria-controls="testimonials-more"
                    className="inline-flex items-center justify-center gap-2 bg-[#F5C200] text-[#1A0A5E] font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#E6B000] active:scale-95 transition-all duration-150 shadow-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A0A5E] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                  >
                    {isExpanded ? 'Show less' : expandLabel}
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              </>
            ) : null}

            {/* Share your own — kept behind a toggle once real cards exist. */}
            <div className="mt-10">
              {isFormOpen ? (
                <SubmitForm onSubmitted={() => setIsFormOpen(false)} />
              ) : (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex items-center justify-center gap-2 border-2 border-[#1A0A5E] text-[#1A0A5E] font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#1A0A5E] hover:text-white transition-colors"
                  >
                    <Quote size={16} aria-hidden="true" /> Share Your Testimony
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
