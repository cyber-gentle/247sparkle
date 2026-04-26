import PublicFooter from '@/components/PublicFooter';
import PublicNavbar from '@/components/PublicNavbar';

export default function ContactPage() {
  return (
    <>
      <PublicNavbar />
      <main className="bg-slate-50 pb-20 pt-24">
        <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 lg:grid-cols-2 lg:px-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#CC0000]">
              Contact
            </p>
            <h1 className="text-3xl font-extrabold text-[#1A0A5E]">Let&apos;s Talk</h1>
            <p className="mt-3 text-sm text-slate-600">
              Send us a message and our team will get back to you quickly.
            </p>
            <form className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#1A0A5E]"
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#1A0A5E]"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#1A0A5E]"
              />
              <textarea
                placeholder="How can we help you?"
                rows={5}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#1A0A5E]"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#1A0A5E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#120843]"
              >
                Send Message
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-bold text-[#1A0A5E]">Contact Details</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li>Phone: 09039661885</li>
                <li>WhatsApp: 07052258764</li>
                <li>Email: info.247sparkle@gmail.com</li>
                <li>Location: Lagos, Nigeria</li>
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <iframe
                title="Lagos Map"
                src="https://maps.google.com/maps?q=Lagos%2C%20Nigeria&t=&z=11&ie=UTF8&iwloc=&output=embed"
                className="h-72 w-full"
                loading="lazy"
              />
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
