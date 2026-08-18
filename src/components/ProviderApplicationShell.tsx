'use client';

import Link from 'next/link';
import React, { type ReactNode } from 'react';
import { ArrowLeft, CheckCircle2, CircleHelp } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';

export interface ApplicationStep {
  title: string;
  description: string;
}

interface ProviderApplicationShellProps {
  eyebrow: string;
  title: string;
  description: string;
  applicationTitle: string;
  applicationDescription: string;
  loginHref: string;
  loginLabel: string;
  steps: ApplicationStep[];
  children: ReactNode;
}

export default function ProviderApplicationShell({
  eyebrow,
  title,
  description,
  applicationTitle,
  applicationDescription,
  loginHref,
  loginLabel,
  steps,
  children,
}: ProviderApplicationShellProps) {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-[#1A0A5E]"
          >
            <ArrowLeft size={16} />
            Home
          </Link>
          <AppLogo height={38} showWordmark />
          <Link
            href={loginHref}
            className="text-right text-sm font-semibold text-[#1A0A5E] transition-colors hover:text-[#120843]"
          >
            {loginLabel}
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 sm:py-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
        <aside className="self-start lg:sticky lg:top-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1A0A5E]/60">
            {eyebrow}
          </p>
          <h1 className="mt-3 max-w-xl text-3xl font-extrabold tracking-[-0.035em] text-[#1A0A5E] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">{description}</p>

          <div className="mt-8 border-y border-slate-200 py-1">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex gap-4 border-b border-slate-200 py-4 last:border-b-0"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1A0A5E] text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{step.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3 rounded-xl border border-[#F5C200]/60 bg-[#FFF9E5] p-4">
            <CircleHelp className="mt-0.5 shrink-0 text-[#A76E00]" size={19} />
            <div>
              <p className="text-sm font-bold text-[#5A3B00]">What happens after you apply</p>
              <p className="mt-1 text-sm leading-6 text-[#725107]">
                We review each application before activating access. We will contact you if any
                further information is needed.
              </p>
            </div>
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="border-b border-slate-200 pb-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 text-[#0C8A5B]" size={22} />
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.02em] text-[#1A0A5E]">
                  {applicationTitle}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{applicationDescription}</p>
              </div>
            </div>
          </div>
          <div className="pt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
