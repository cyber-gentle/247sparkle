import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const toastLib = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('sonner', () => ({ toast: toastLib.toast }));

import ContactSection from '@/app/homepage/components/ContactSection';

describe('ContactSection', () => {
  it('renders the contact cards without dead links', () => {
    const markup = renderToStaticMarkup(<ContactSection />);

    expect(markup).toContain('09039661885');
    expect(markup).toContain('info.247sparkle@gmail.com');
    expect(markup).toContain('Otukpo, Benue State');

    // Every rendered link must target something real (no placeholder '#').
    expect(markup).not.toContain('href="#"');
  });

  it('contains no Google Maps embeds or links (removed to avoid API charges)', () => {
    const markup = renderToStaticMarkup(<ContactSection />);

    expect(markup).not.toContain('google.com/maps');
    expect(markup).not.toContain('openstreetmap.org');
    expect(markup).not.toContain('maps/embed');
  });
});
