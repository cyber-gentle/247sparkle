import Link from 'next/link';

interface PortalScaffoldPageProps {
  portalLabel: string;
  title: string;
  description: string;
  highlights: string[];
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
}

export default function PortalScaffoldPage({
  portalLabel,
  title,
  description,
  highlights,
  primaryCta,
  secondaryCta,
}: PortalScaffoldPageProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#F5C200]/10 px-6 py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="rounded-2xl border border-[#1A0A5E]/10 bg-white p-8 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#CC0000]">
            {portalLabel}
          </p>
          <h1 className="mb-3 text-3xl font-extrabold text-[#1A0A5E]">{title}</h1>
          <p className="max-w-3xl text-sm text-slate-600">{description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={primaryCta.href}
              className="rounded-xl bg-[#1A0A5E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#120843]"
            >
              {primaryCta.label}
            </Link>
            {secondaryCta ? (
              <Link
                href={secondaryCta.href}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#1A0A5E]">Implementation Focus</h2>
          <ul className="space-y-3">
            {highlights.map((highlight) => (
              <li
                key={highlight}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                {highlight}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
