import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AppLogo from '@/components/ui/AppLogo';

describe('AppLogo', () => {
  it('renders the supplied 247Sparkle logo image alongside the optional wordmark', () => {
    const markup = renderToStaticMarkup(<AppLogo height={48} showWordmark tone="dark" />);

    expect(markup).toContain('247');
    expect(markup).toContain('Sparkle');
    expect(markup).toContain('Laundry &amp; Cleaning');
    expect(markup).toContain('logo.jpeg');
    expect(markup).toContain('247Sparkle official logo');
  });
});
