'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Phone, Mail, MapPin, MessageCircle, Send, Loader2 } from 'lucide-react';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    // TODO: Backend integration — POST /api/contact with form data
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    reset();
    toast.success("Message sent! We'll get back to you within 24 hours.");
  };

  return (
    <section id="contact" className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-14">
          <span className="text-xs font-bold tracking-widest uppercase text-[#CC0000] mb-3 block">
            Get In Touch
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-[#1A0A5E] mb-4">
            Contact Us
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base">
            Have a question or need a custom quote? We&apos;re always available — 24 hours a day, 7
            days a week.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div>
            <div className="space-y-5 mb-8">
              {[
                {
                  icon: Phone,
                  label: 'Call Us',
                  value: '09039661885',
                  href: 'tel:09039661885',
                  color: '#1A0A5E',
                },
                {
                  icon: MessageCircle,
                  label: 'WhatsApp',
                  value: '07052258764',
                  href: 'https://wa.me/2347052258764',
                  color: '#25D366',
                },
                {
                  icon: Mail,
                  label: 'Email',
                  value: 'info.247sparkle@gmail.com',
                  href: 'mailto:info.247sparkle@gmail.com',
                  color: '#CC0000',
                },
                {
                  icon: MapPin,
                  label: 'Location',
                  value: 'Otukpo, Benue State',
                  href: '#',
                  color: '#F5C200',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={`contact-${item.label.toLowerCase()}`}
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="public-card public-card-hover flex items-center gap-4 p-4 group"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      <Icon size={20} style={{ color: item.color }} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        {item.label}
                      </div>
                      <div className="text-sm font-bold text-[#1A0A5E]">{item.value}</div>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Map placeholder */}
            <div className="public-card flex h-48 items-center justify-center bg-gray-100">
              <div className="text-center">
                <MapPin size={32} className="text-[#F5C200] mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">Otukpo, Benue State</p>
                <p className="text-xs text-gray-400">Map integration coming soon</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="public-card public-card-accent">
            <div className="public-card-body">
              <h3 className="text-lg font-bold text-[#1A0A5E] mb-6">Send Us a Message</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    type="text"
                    placeholder="e.g. Adaeze Okonkwo"
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#F5C200]/30 ${
                      errors.name
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 focus:border-[#F5C200]'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Email
                    </label>
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                      })}
                      type="email"
                      placeholder="you@email.com"
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#F5C200]/30 ${
                        errors.email
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 focus:border-[#F5C200]'
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      {...register('phone', { required: 'Phone is required' })}
                      type="tel"
                      placeholder="080XXXXXXXX"
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#F5C200]/30 ${
                        errors.phone
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 focus:border-[#F5C200]'
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Message
                  </label>
                  <textarea
                    {...register('message', {
                      required: 'Message is required',
                      minLength: { value: 20, message: 'Please write at least 20 characters' },
                    })}
                    rows={4}
                    placeholder="Tell us about your cleaning needs..."
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#F5C200]/30 resize-none ${
                      errors.message
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 focus:border-[#F5C200]'
                    }`}
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#1A0A5E] text-white font-bold py-3.5 rounded-xl text-sm hover:bg-[#2D1B8E] active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
