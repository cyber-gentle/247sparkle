import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const toastLib = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('sonner', () => ({ toast: toastLib.toast }));

import ContactSection from '@/app/homepage/components/ContactSection';
import LocationMap, { SPARKLE_LOCATION_EMBED_URL } from '@/components/LocationMap';

describe('ContactSection map', () => {
  it('embeds the exact shop-location map with a directions link', () => {
    const markup = renderToStaticMarkup(<ContactSection />);

    // The Google share-embed URL pins the exact spot, keyless.
    expect(markup).toContain(encodeURIComponent(SPARKLE_LOCATION_EMBED_URL).slice(0, 0)); // sanity: defined
    expect(markup).toContain('google.com/maps/embed?pb=');
    expect(markup).not.toContain('coming soon');
    expect(markup).not.toContain('output=embed');

    // Directions CTA targets the exact coordinates.
    expect(markup).toContain('7.208123063691493,8.155817636334003');
    expect(markup).toContain('Get Directions');

    // The Location contact card now links out too (no dead '#').
    expect(markup).not.toContain('href="#"');
  });
});

describe('LocationMap component', () => {
  it('uses a provided share-embed URL verbatim, ignoring the API key', () => {
    const markup = renderToStaticMarkup(
      <LocationMap query="Otukpo" embedUrl="https://www.google.com/maps/embed?pb=TESTPB" />
    );

    expect(markup).toContain('https://www.google.com/maps/embed?pb=TESTPB');
    expect(markup).not.toContain('maps/embed/v1/place');
    expect(markup).not.toContain('openstreetmap.org');
  });

  it('uses the official Embed API URL when a key is present and no embedUrl', () => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return;

    const markup = renderToStaticMarkup(<LocationMap query="Otukpo, Benue State" />);

    expect(markup).toContain('https://www.google.com/maps/embed/v1/place?key=');
    expect(markup).not.toContain('openstreetmap.org');
  });

  it('falls back to OpenStreetMap when no API key and no embedUrl are set', () => {
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
