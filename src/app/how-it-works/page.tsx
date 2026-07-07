import Link from 'next/link';
import PublicFooter from '@/components/PublicFooter';
import PublicNavbar from '@/components/PublicNavbar';
import HowItWorksSection from '@/app/homepage/components/HowItWorksSection';

export default function HowItWorksPage() {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-white pb-20 pt-24">
        <HowItWorksSection />
        
        {/* Call to action */}
        <section className="mx-auto w-full max-w-4xl px-6 lg:px-10 mt-10">
          <div className="bg-[#1A0A5E] rounded-3xl p-10 text-center shadow-xl relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#CC0000]/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to experience the Sparkle?</h2>
              <p className="text-white/80 mb-8 max-w-2xl mx-auto">
                Join thousands of satisfied customers who trust us with their laundry, cleaning, and fumigation needs.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/customer/signup"
                  className="rounded-xl bg-[#F5C200] px-8 py-3.5 font-bold text-[#1A0A5E] transition hover:bg-[#E6B000] hover:-translate-y-1 shadow-lg"
                >
                  Book a Service Now
                </Link>
                <Link
                  href="/services"
                  className="rounded-xl bg-white/10 border border-white/20 px-8 py-3.5 font-bold text-white transition hover:bg-white/20 hover:-translate-y-1"
                >
                  Explore Services
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
