import React from 'react';
import { Toaster } from 'sonner';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import FloatingActionButtons from '@/components/FloatingActionButtons';
import HeroSection from './components/HeroSection';
import HowItWorksSection from './components/HowItWorksSection';
import ServicesSection from './components/ServicesSection';
import TrustSection from './components/TrustSection';
import AboutSection from './components/AboutSection';
import TestimonialsSection from './components/TestimonialsSection';
import PartnerBanner from './components/PartnerBanner';
import ContactSection from './components/ContactSection';

export default function HomepagePage() {
  return (
    <>
      <Toaster position="bottom-right" richColors />
      <PublicNavbar />
      <FloatingActionButtons />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <ServicesSection />
        <TrustSection />
        <AboutSection />
        <TestimonialsSection />
        <PartnerBanner />
        <ContactSection />
      </main>
      <PublicFooter />
    </>
  );
}