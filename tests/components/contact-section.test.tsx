import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const toastLib = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('sonner', () => ({ toast: toastLib.toast }));

import ContactSection from '@/app/homepage/components/ContactSection';

describe('ContactSection map', () => {
  it('embeds the Otukpo map and a directions link instead of a placeholder', () => {
    const markup = renderToStaticMarkup(<ContactSection />);

    // Keyless Google Maps embed (same one the /contact page uses).
    expect(markup).toContain('maps.google.com/maps?q=Otukpo');
    expect(markup).toContain('output=embed');
    expect(markup).not.toContain('coming soon');

    // Directions CTA opens Google Maps in a new tab.
    expect(markup).toContain('https://maps.google.com/?q=Otukpo,+Benue+State');
    expect(markup).toContain('Get Directions');

    // The Location contact card now links out too (no dead '#').
    expect(markup).not.toContain('href="#"');
  });
});
