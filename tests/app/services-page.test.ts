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

  it('keeps each service card image-led with a direct customer request path', () => {
    const source = readFileSync(servicesPage, 'utf8');

    expect(source).toContain('bg-gradient-to-t from-[#10073D]');
    expect(source).toContain('Start a request');
    expect(source).toContain('href="/customer/signup"');
  });
});
