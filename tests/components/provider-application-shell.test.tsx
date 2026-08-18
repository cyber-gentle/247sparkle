import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ProviderApplicationShell from '../../src/components/ProviderApplicationShell';

describe('ProviderApplicationShell', () => {
  it('renders a practical review-based onboarding structure instead of promotional metrics', () => {
    const markup = renderToStaticMarkup(
      <ProviderApplicationShell
        eyebrow="Rider applications"
        title="Join the delivery network"
        description="Apply in a few minutes."
        applicationTitle="Rider application"
        applicationDescription="Use your contact details."
        loginHref="/rider/login"
        loginLabel="Already registered? Sign in"
        steps={[{ title: 'Review', description: 'We review applications before activation.' }]}
      >
        <form>Form content</form>
      </ProviderApplicationShell>
    );

    expect(markup).toContain('What happens after you apply');
    expect(markup).toContain('We review applications before activation.');
    expect(markup).toContain('Already registered? Sign in');
    expect(markup).not.toContain('Earn 20% Commission');
  });
});
