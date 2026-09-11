'use client';

import Link from 'next/link';
import React, { type ReactNode } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';

export interface AuthFeature {
  icon: LucideIcon;
  text: string;
}

export interface AuthNotice {
  title: string;
  text: string;
}

interface PortalAuthShellProps {
  /** Small uppercase label, e.g. "Rider Portal" */
  portal: string;
  /** Icon shown in the card header */
  icon: LucideIcon;
  /** Headline on the info panel, e.g. "Welcome Back, Rider!" */
  title: string;
  /** Supporting paragraph under the headline */
  description: string;
  /** Card heading, e.g. "Rider Login" */
  cardTitle: string;
  /** Small line under the card heading */
  cardDescription: string;
  /** Highlighted features listed on the info panel */
  features?: AuthFeature[];
  /** Callout box under the features (e.g. pending-approval note) */
  notice?: AuthNotice;
  /** Cross-link shown in the header, opposite Back to Home */
  switchHref?: string;
  switchLabel?: string;
  children: ReactNode;
}

export default function PortalAuthShell({
  portal,
  icon: Icon,
  title,
  description,
  cardTitle,
  cardDescription,
  features,
  notice,
  switchHref,
  switchLabel,
  children,
}: PortalAuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#1A0A5E] px-5 py-8 sm:px-8 sm:py-12">
      {/* Brand atmosphere — gold and red glows over deep navy */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(77,88,255,0.35),transparent_55%)]" />
        <div className="absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-[#F5C200]/15 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#CC0000]/20 blur-3xl" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute -right-8 top-20 h-40 w-40 rounded-full border border-[#F5C200]/25" />
      </div>

      {/* Brand gradient ribbon */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#F5C200_0%,#CC0000_45%,#1A0A5E_100%)]"
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <AppLogo height={40} showWordmark tone="dark" />
          {switchHref ? (
            <Link
              href={switchHref}
              className="hidden text-sm font-semibold text-[#F5C200] transition hover:text-[#FFD84D] sm:block"
            >
              {switchLabel}
            </Link>
          ) : (
            <span aria-hidden="true" className="hidden w-0 sm:block" />
          )}
        </header>

        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Info panel */}
          <div className="animate-slide-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#F5C200]/40 bg-[#F5C200]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#F5C200]">
              <Sparkles size={13} />
              {portal}
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-[-0.03em] text-white lg:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/75">{description}</p>

            {features && features.length > 0 && (
              <ul className="mt-8 space-y-4">
                {features.map((feature) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <li key={feature.text} className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#F5C200_0%,#E6A800_100%)] text-[#1A0A5E] shadow-[0_10px_24px_rgba(245,194,0,0.25)]">
                        <FeatureIcon size={19} />
                      </span>
                      <p className="text-sm font-semibold text-white/90">{feature.text}</p>
                    </li>
                  );
                })}
              </ul>
            )}

            {notice && (
              <div className="mt-8 flex items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm">
                <ShieldCheck className="mt-0.5 shrink-0 text-[#F5C200]" size={20} />
                <div>
                  <h2 className="text-sm font-bold text-white">{notice.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-white/70">{notice.text}</p>
                </div>
              </div>
            )}
          </div>

          {/* Form card with brand gradient accent */}
          <div className="animate-fade-in">
            <div className="public-card public-card-accent">
              <div className="public-card-body p-6 sm:p-10">
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1A0A5E_0%,#2D1B8E_100%)] text-[#F5C200] shadow-[0_14px_30px_rgba(26,10,94,0.25)]">
                    <Icon size={30} />
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#1A0A5E]">{cardTitle}</h2>
                  <p className="mt-1 text-sm text-slate-500">{cardDescription}</p>
                </div>

                {children}

                <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
                  <CheckCircle2 size={13} className="text-[#0C8A5B]" />
                  Protected by 247Sparkle secure sign-in
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
