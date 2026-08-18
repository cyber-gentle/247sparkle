import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const servicesPage = resolve(process.cwd(), 'src/app/services/page.tsx');

describe('services page visual service cards', () => {
  it('uses the project-owned images for all primary service categories', () => {
    const source = readFileSync(servicesPage, 'utf8');

    expect(source).toContain('/images/bg-image.jpeg');
    expect(source).toContain('/images/home_cleaning__2__.jpeg');
    expect(source).toContain('/images/Office_cleaning.jpeg');
    expect(source).toContain('/images/fumigation-service.jpg');
  });

  it('keeps a lighter image overlay above a separate explanatory content panel and request path', () => {
    const source = readFileSync(servicesPage, 'utf8');

    expect(source).toContain('bg-gradient-to-t from-[#1A0A5E]/45');
    expect(source).toContain('bg-white shadow-[0_24px_65px_rgba(15,23,42,0.12)]');
    expect(source).toContain('text-slate-600');
    expect(source).toContain('Start a request');
    expect(source).toContain('href="/customer/signup"');
  });

  it('plays the supplied ironing video as a muted looping page background while retaining both pricing cards', () => {
    const source = readFileSync(servicesPage, 'utf8');

    expect(source).toContain('autoPlay');
    expect(source).toContain('loop');
    expect(source).toContain('muted');
    expect(source).toContain('playsInline');
    expect(source).toContain('src="/iron/iron.mp4"');
    expect(source).toContain('Laundry Pricing');
    expect(source).toContain('Fumigation Pricing');
    expect(source).not.toContain('controls');
  });
});
