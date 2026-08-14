'use client';

import { FormEvent, useState } from 'react';

import PublicFooter from '@/components/PublicFooter';
import PublicNavbar from '@/components/PublicNavbar';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    serviceType: 'office_cleaning',
    contactName: '',
    businessName: '',
    address: '',
    phone: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback('');

    try {
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFeedback(data.error ?? 'Unable to submit request right now.');
        return;
      }

      setFeedback('Request submitted successfully. Our team will contact you shortly.');
      setFormData({
        serviceType: 'office_cleaning',
        contactName: '',
        businessName: '',
        address: '',
        phone: '',
        email: '',
        message: '',
      });
    } catch {
      setFeedback('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PublicNavbar />
      <main className="bg-slate-50 pb-20 pt-24">
        <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 lg:grid-cols-2 lg:px-10">
          <div className="public-card public-card-accent">
            <div className="public-card-body">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#CC0000]">
                Contact
              </p>
              <h1 className="text-3xl font-extrabold text-[#1A0A5E]">Let&apos;s Talk</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Send your quote request and our team will get back to you quickly.
              </p>
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <select
                  value={formData.serviceType}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, serviceType: event.target.value }))
                  }
                  className="public-field"
                >
                  <option value="office_cleaning">Office Cleaning</option>
                  <option value="office_fumigation">Office Fumigation</option>
                  <option value="commercial_fumigation">Commercial Fumigation</option>
                </select>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.contactName}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, contactName: event.target.value }))
                  }
                  className="public-field"
                  required
                />
                <input
                  type="text"
                  placeholder="Business Name (optional)"
                  value={formData.businessName}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, businessName: event.target.value }))
                  }
                  className="public-field"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  className="public-field"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="public-field"
                  required
                />
                <input
                  type="text"
                  placeholder="Property / Office Address"
                  value={formData.address}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, address: event.target.value }))
                  }
                  className="public-field"
                  required
                />
                <textarea
                  placeholder="How can we help you?"
                  rows={5}
                  value={formData.message}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, message: event.target.value }))
                  }
                  className="public-field"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#1A0A5E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#120843]"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
                {feedback ? (
                  <p className="text-sm font-medium text-slate-700" role="status">
                    {feedback}
                  </p>
                ) : null}
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="public-card public-card-accent">
              <div className="public-card-body">
                <h2 className="text-xl font-bold text-[#1A0A5E]">Contact Details</h2>
                <dl className="mt-5 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-slate-50/70 text-sm">
                  {[
                    ['Phone', '09039661885'],
                    ['WhatsApp', '07052258764'],
                    ['Email', 'info.247sparkle@gmail.com'],
                    ['Location', 'Otukpo, Benue State'],
                  ].map(([label, value]) => (
                    <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[7rem_1fr]">
                      <dt className="font-bold text-slate-500">{label}</dt>
                      <dd className="font-semibold text-slate-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="public-card overflow-hidden">
              <iframe
                title="Otukpo Map"
                src="https://maps.google.com/maps?q=Otukpo%2C%20Benue%20State&t=&z=11&ie=UTF8&iwloc=&output=embed"
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
