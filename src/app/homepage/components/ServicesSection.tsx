import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { ArrowRight, Shirt, Home, Building2, Bug } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const SERVICES = [
{
  id: 'service-laundry',
  icon: Shirt,
  title: 'Laundry',
  subtitle: 'Wash, Iron & Fold',
  description: 'From everyday wear to delicate fabrics — Lace, Agbada, Jeans, Bedsheets, Curtains and more. Separate white wash available.',
  image: null,
  color: 'from-[#F5C200]/10 to-[#F5C200]/5',
  accent: '#F5C200',
  tags: ['Wash & Fold', 'Iron', 'Pickup & Delivery'],
  price: 'From ₦500/item'
},
{
  id: 'service-home-cleaning',
  icon: Home,
  title: 'Home Cleaning',
  subtitle: 'Residential Deep Clean',
  description: 'Professional cleaners come to your home with all equipment. Bedrooms, kitchen, bathroom, living area — spotless every time.',
  image: "/assets/images/Home_cleaning-1776946647980.jpeg",
  imageAlt: 'Professional cleaner scrubbing toilet during residential home cleaning service',
  color: 'from-[#1A0A5E]/10 to-[#1A0A5E]/5',
  accent: '#1A0A5E',
  tags: ['Residential', 'Post-Construction', 'Scheduled'],
  price: 'Fixed pricing'
},
{
  id: 'service-office-cleaning',
  icon: Building2,
  title: 'Office Cleaning',
  subtitle: 'Commercial Spaces',
  description: 'Keep your workspace pristine. We clean offices, commercial spaces and corporate environments to the highest professional standard.',
  image: "/assets/images/Office_cleaning-1776946977872.jpeg",
  imageAlt: 'Clean modern office space after professional cleaning service',
  color: 'from-[#CC0000]/10 to-[#CC0000]/5',
  accent: '#CC0000',
  tags: ['Office', 'Corporate', 'Quotation-based'],
  price: 'Get a quote'
},
{
  id: 'service-fumigation',
  icon: Bug,
  title: 'Fumigation',
  subtitle: 'Pest Control & Certification',
  description: 'Licensed fumigation for homes and offices. Receive a verifiable 247 Sparkle Fumigation Certificate upon completion.',
  image: null,
  color: 'from-[#059669]/10 to-[#059669]/5',
  accent: '#059669',
  tags: ['Residential', 'Commercial', 'Certificate Issued'],
  price: 'From ₦8,000'
}];


export default function ServicesSection() {
  return (
    <section id="services" className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs font-bold tracking-widest uppercase text-[#CC0000] mb-3 block">What We Offer</span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-[#1A0A5E] mb-4">
            Our Services
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
            From your daily wear to your entire apartment — we&apos;ve got every cleaning need covered, delivered right to your door.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {SERVICES?.map((service) => {
            const Icon = service?.icon;
            return (
              <div
                key={service?.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group flex flex-col">

                {/* Image or Gradient Header */}
                {service?.image ?
                <div className="relative h-44 overflow-hidden">
                    <AppImage
                    src={service?.image}
                    alt={service?.imageAlt || service?.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw" />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div
                    className="absolute top-4 left-4 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: service?.accent }}>

                      <Icon size={20} className="text-white" />
                    </div>
                  </div> :

                <div className={`h-44 bg-gradient-to-br ${service?.color} flex items-center justify-center relative overflow-hidden`}>
                    <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: service?.accent }}>

                      <Icon size={36} className="text-white" />
                    </div>
                    {/* Decorative circles */}
                    <div
                    className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10"
                    style={{ backgroundColor: service?.accent }} />

                    <div
                    className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-10"
                    style={{ backgroundColor: service?.accent }} />

                  </div>
                }
                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="mb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{service?.subtitle}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1A0A5E] mb-2">{service?.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">{service?.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {service?.tags?.map((tag) =>
                    <span
                      key={`${service?.id}-tag-${tag?.toLowerCase()?.replace(/\s+/g, '-')}`}
                      className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">

                        {tag}
                      </span>
                    )}
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm font-bold" style={{ color: service?.accent }}>
                      {service?.price}
                    </span>
                    <Link
                      href="/customer-dashboard"
                      className="flex items-center gap-1 text-sm font-bold text-[#1A0A5E] hover:text-[#CC0000] transition-colors group-hover:gap-2">

                      Book Now
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>);

          })}
        </div>
      </div>
    </section>);

}