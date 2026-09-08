import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const toastLib = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('sonner', () => ({ toast: toastLib.toast }));

import ContactSection from '@/app/homepage/components/ContactSection';
import LocationMap from '@/components/LocationMap';

const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

describe('ContactSection map', () => {
  it('embeds the Otukpo map and a directions link instead of a placeholder', () => {
    const markup = renderToStaticMarkup(<ContactSection />);

    // Official Maps Embed API (or OSM fallback when no key is configured).
    if (mapsKey) {
      expect(markup).toContain('https://www.google.com/maps/embed/v1/place?key=');
    } else {
      expect(markup).toContain('openstreetmap.org/export/embed.html');
    }
    expect(markup).not.toContain('coming soon');
    expect(markup).not.toContain('output=embed');

    // Directions CTA opens Google Maps in a new tab.
    expect(markup).toContain('https://maps.google.com/?q=Otukpo,+Benue+State');
    expect(markup).toContain('Get Directions');

    // The Location contact card now links out too (no dead '#').
    expect(markup).not.toContain('href="#"');
  });
});

describe('LocationMap component', () => {
  it('uses the official Embed API URL when a key is present', () => {
    if (!mapsKey) return; // no key in this environment → fallback covered below

    const markup = renderToStaticMarkup(<LocationMap query="Otukpo, Benue State" />);

    expect(markup).toContain('https://www.google.com/maps/embed/v1/place?key=');
    expect(markup).toContain(encodeURIComponent('Otukpo, Benue State'));
    expect(markup).not.toContain('openstreetmap.org');
  });

  it('falls back to OpenStreetMap when no API key is configured', () => {
    const original = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = '';

    try {
      const markup = renderToStaticMarkup(<LocationMap query="Otukpo, Benue State" />);

      expect(markup).toContain('openstreetmap.org/export/embed.html');
      expect(markup).not.toContain('maps/embed/v1/place');
    } finally {
      (process.env as Record<string, string | undefined>).NEXT_PUBLIC_GOOGLE_MAPS_API_KEY =
        original;
    }
  });
});
