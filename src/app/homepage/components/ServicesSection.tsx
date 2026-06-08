import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { ArrowRight, Shirt, Home, Building2, Bug } from 'lucide-react';

const SERVICES = [
  {
    id: 'service-laundry',
    icon: Shirt,
    title: 'Laundry',
    subtitle: 'Wash, Iron & Fold',
    description:
      'Professional care for all fabrics. From everyday wear to delicate Agbada and lace — clean, fresh, and perfectly pressed.',
    image: '/images/bg-image.jpeg',
    imageAlt: 'Modern laundry room with washing machines and clean clothes',
    imagePosition: 'center',
    color: 'from-[#F5C200]/10 to-[#F5C200]/5',
    accent: '#F5C200',
    tags: ['Wash & Fold', 'Iron & Press', 'Free Delivery'],
    price: 'From ₦500/item',
  },
  {
    id: 'service-home-cleaning',
    icon: Home,
    title: 'Home Cleaning',
    subtitle: 'Residential Deep Clean',
    description:
      'Thorough, professional cleaning of bedrooms, kitchens, bathrooms, and living areas. Your home, spotless every time.',
    image: '/images/home_cleaning__2__.jpeg',
    imageAlt: 'Professional cleaner scrubbing toilet during residential home cleaning service',
    imagePosition: 'center',
    color: 'from-[#1A0A5E]/10 to-[#1A0A5E]/5',
    accent: '#1A0A5E',
    tags: ['Residential', 'Weekly/Monthly', 'Equipment Included'],
    price: 'Fixed pricing',
  },
  {
    id: 'service-office-cleaning',
    icon: Building2,
    title: 'Office Cleaning',
    subtitle: 'Commercial Spaces',
    description:
      'Pristine workspaces for better productivity. Professional cleaning for offices and corporate environments, scheduled around your business hours.',
    image: '/images/Office_cleaning.jpeg',
    imageAlt: 'Clean modern office space after professional cleaning service',
    imagePosition: 'center',
    color: 'from-[#CC0000]/10 to-[#CC0000]/5',
    accent: '#CC0000',
    tags: ['Commercial', 'Scheduled', 'Customized Plans'],
    price: 'Get a quote',
  },
  {
    id: 'service-fumigation',
    icon: Bug,
    title: 'Fumigation',
    subtitle: 'Pest Control & Certification',
    description:
      'Licensed fumigation service for homes and offices. Certified professionals using safe, effective methods. Certificate issued upon completion.',
    image: '/images/equipments.jpeg',
    imageAlt: 'Professional cleaning and fumigation equipment ready for service',
    imagePosition: 'center',
    color: 'from-[#059669]/10 to-[#059669]/5',
    accent: '#059669',
    tags: ['Licensed', 'Safe & Effective', 'Certificate Included'],
    price: 'From ₦8,000',
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-widest uppercase text-[#CC0000] mb-3 block">
            Complete Solutions
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-[#1A0A5E] mb-4">
            One App, All Your Cleaning Needs
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-base leading-relaxed">
            Whether it&apos;s laundry, your home, your office, or pest control — we handle everything with the same professional care and attention to detail.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {SERVICES?.map((service) => {
            const Icon = service?.icon;
            return (
              <div key={service?.id} className="public-card public-card-hover group flex flex-col">
                <div className="relative h-60 overflow-hidden bg-slate-100">
                  <AppImage
                    src={service?.image}
                    alt={service?.imageAlt || service?.title}
                    fill
                    className="transition-transform duration-500 group-hover:scale-[1.04]"
                    style={{ objectFit: 'cover', objectPosition: service?.imagePosition }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
                  <div
                    className="absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
                    style={{ backgroundColor: service?.accent }}
                  >
                    <Icon size={20} className="text-white" />
                  </div>
                </div>
                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {service?.subtitle}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1A0A5E] mb-2">{service?.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
                    {service?.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {service?.tags?.map((tag) => (
                      <span
                        key={`${service?.id}-tag-${tag?.toLowerCase()?.replace(/\s+/g, '-')}`}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm font-bold" style={{ color: service?.accent }}>
                      {service?.price}
                    </span>
                    <Link
                      href="/customer/signup"
                      className="flex items-center gap-1 text-sm font-bold text-[#1A0A5E] hover:text-[#CC0000] transition-colors group-hover:gap-2"
                    >
                      Book Now
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
