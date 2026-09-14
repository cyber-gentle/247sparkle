'use client';

import { useEffect, useState } from 'react';
import { Check, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

type Testimonial = {
  id: string;
  name: string;
  location?: string | null;
  service: string;
  rating: number;
  quote: string;
  approved: boolean;
  createdAt: string;
};

const SERVICE_LABELS: Record<string, string> = {
  LAUNDRY: 'Laundry',
  HOME_CLEANING: 'Home Cleaning',
  OFFICE_CLEANING: 'Office Cleaning',
  FUMIGATION: 'Fumigation',
};

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const response = await fetch('/api/admin/testimonials');
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { testimonials: Testimonial[] };
      setTestimonials(data.testimonials ?? []);
    } catch {
      toast.error('Failed to load testimonials.');
    } finally {
      setLoading(false);
    }
  }

  async function setApproval(id: string, approved: boolean) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      if (!response.ok) throw new Error();
      setTestimonials((prev) =>
        prev.map((item) => (item.id === id ? { ...item, approved } : item))
      );
      toast.success(approved ? 'Testimonial published.' : 'Testimonial unpublished.');
    } catch {
      toast.error('Unable to update testimonial.');
    } finally {
      setBusyId('');
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      setTestimonials((prev) => prev.filter((item) => item.id !== id));
      toast.success('Testimonial deleted.');
    } catch {
      toast.error('Unable to delete testimonial.');
    } finally {
      setBusyId('');
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading testimonials...</p>
      </main>
    );
  }

  const pending = testimonials.filter((item) => !item.approved);
  const published = testimonials.filter((item) => item.approved);

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-extrabold text-[#1A0A5E]">Testimonials</h1>
          <p className="text-sm text-slate-500 mt-1">
            Public submissions appear on the homepage only after you approve them.
          </p>
        </header>

        {[
          { title: `Pending review (${pending.length})`, items: pending },
          { title: `Published (${published.length})`, items: published },
        ].map(({ title, items }) => (
          <section key={title} className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">{title}</h2>
            {items.length === 0 ? (
              <p className="text-sm text-slate-400 bg-white rounded-xl border border-slate-200 p-4">
                Nothing here yet.
              </p>
            ) : (
              items.map((item) => (
                <article
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#1A0A5E]">{item.name}</span>
                        {item.location && (
                          <span className="text-xs text-slate-400">{item.location}</span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F5C200]/15 text-[#1A0A5E] px-2 py-0.5 rounded-full">
                          {SERVICE_LABELS[item.service] ?? item.service}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        &ldquo;{item.quote}&rdquo;
                      </p>
                      <div
                        className="flex items-center gap-0.5 mt-2"
                        aria-label={`${item.rating} stars`}
                      >
                        {Array.from({ length: 5 }, (_, i) => i + 1).map((s) => (
                          <span
                            key={s}
                            className={s <= item.rating ? 'text-[#F5C200]' : 'text-slate-300'}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.approved ? (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => setApproval(item.id, false)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-100 disabled:opacity-50"
                        >
                          <X size={14} /> Unpublish
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => setApproval(item.id, true)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg px-3 py-1.5 hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check size={14} /> Approve
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => remove(item.id)}
                        aria-label={`Delete testimonial from ${item.name}`}
                        className="inline-flex items-center text-slate-400 rounded-lg p-1.5 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
