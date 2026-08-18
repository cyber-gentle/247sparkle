'use client';

import React, { memo, useMemo } from 'react';
import Image from 'next/image';

interface AppLogoProps {
  src?: string;
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  onClick?: () => void;
  showWordmark?: boolean;
  tone?: 'light' | 'dark';
}

const AppLogo = memo(function AppLogo({
  src = '/images/logo.jpeg',
  size = 64,
  width,
  height,
  className = '',
  onClick,
  showWordmark = false,
  tone = 'light',
}: AppLogoProps) {
  const containerClassName = useMemo(() => {
    const classes = ['inline-flex items-center min-w-0'];
    if (onClick) classes.push('cursor-pointer hover:opacity-80 transition-opacity');
    if (className) classes.push(className);
    return classes.join(' ');
  }, [onClick, className]);

  const finalHeight = height || width || size;
  const wordmarkSize = Math.max(16, Math.min(26, Math.round(finalHeight * 0.5)));
  const taglineSize = Math.max(8, Math.min(10, Math.round(finalHeight * 0.19)));
  const isDark = tone === 'dark';

  return (
    <div className={containerClassName} onClick={onClick} aria-label="247Sparkle">
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl border shadow-sm ${
          isDark
            ? 'border-[#F5C200]/80 bg-white shadow-black/15'
            : 'border-[#1A0A5E]/25 bg-white shadow-[#1A0A5E]/20'
        }`}
        style={{ width: finalHeight, height: finalHeight }}
      >
        <Image
          src={src}
          alt="247Sparkle official logo"
          fill
          sizes={`${finalHeight}px`}
          className="object-contain object-center p-px mix-blend-multiply contrast-125 saturate-125"
          priority
        />
      </div>

      {showWordmark ? (
        <div className="ml-2.5 flex min-w-0 flex-col leading-none">
          <span
            className={`font-extrabold tracking-[-0.045em] ${isDark ? 'text-white' : 'text-[#1A0A5E]'}`}
            style={{ fontSize: wordmarkSize }}
          >
            <span className="text-[#F5C200]">247</span>
            <span>Sparkle</span>
          </span>
          <span
            className={`mt-1 font-semibold uppercase tracking-[0.16em] ${isDark ? 'text-white/60' : 'text-[#1A0A5E]/55'}`}
            style={{ fontSize: taglineSize }}
          >
            Laundry &amp; Cleaning
          </span>
        </div>
      ) : null}
    </div>
  );
});

export default AppLogo;
