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
    <main className="min-h-screen bg-slate-50 px-5 py-6 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-5 flex items-center justify-between gap-4 sm:mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-[#1A0A5E]"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <AppLogo height={38} showWordmark />
          <Link
            href={loginHref}
            className="text-right text-sm font-semibold text-[#1A0A5E] transition-colors hover:text-[#120843]"
          >
            {loginLabel}
          </Link>
        </header>

        <div className="grid items-start gap-5 sm:gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          {/* Brand showcase panel */}
          <aside className="public-card public-card-accent isolate !border-[#1A0A5E] !bg-[#1A0A5E] text-white shadow-[0_30px_80px_rgba(26,10,94,0.28)] lg:sticky lg:top-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
              <div className="absolute -right-8 top-16 h-40 w-40 rounded-full border border-[#F5C200]/25" />
              <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[#CC0000]/15 blur-3xl" />
              <div className="absolute right-12 top-8 h-2 w-2 rounded-full bg-[#F5C200] shadow-[0_0_0_7px_rgba(245,194,0,0.08)]" />
            </div>
            <div className="public-card-body relative p-6 sm:p-8 lg:p-10">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F5C200]">
                {eyebrow}
              </p>
              <h1 className="max-w-xl text-2xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/75 sm:mt-4">{description}</p>

              <div className="mt-5 space-y-3 border-t border-white/15 pt-5 sm:mt-8 sm:space-y-4 sm:pt-7">
                {steps.map((step, index) => (
                  <div key={step.title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#F5C200]/70 bg-[#F5C200]/10 text-[11px] font-extrabold text-[#F5C200]">
                      {index + 1}
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-white">{step.title}</h2>
                      <p className="mt-0.5 text-sm leading-5 text-white/70">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-3 rounded-2xl border border-white/15 bg-white/[0.06] p-3.5 sm:mt-8 sm:p-4">
                <CircleHelp className="mt-0.5 shrink-0 text-[#F5C200]" size={19} />
                <div>
                  <p className="text-sm font-bold text-white">What happens after you apply</p>
                  <p className="mt-1 text-sm leading-6 text-white/70">
                    We review each application before activating access. We will contact you if any
                    further information is needed.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Application form card with brand gradient accent */}
          <section className="public-card public-card-accent">
            <div className="public-card-body p-5 sm:p-8">
              <div className="border-b border-slate-200 pb-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 text-[#0C8A5B]" size={22} />
                  <div>
                    <h2 className="text-xl font-extrabold tracking-[-0.02em] text-[#1A0A5E]">
                      {applicationTitle}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {applicationDescription}
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4 sm:pt-6">{children}</div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
