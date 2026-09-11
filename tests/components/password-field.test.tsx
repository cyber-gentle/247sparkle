import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import PasswordField, { PASSWORD_MIN_LENGTH } from '@/components/ui/PasswordField';

describe('PasswordField', () => {
  it('enforces an 8 character minimum as the shared default', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });

  it('renders a masked input with a non-submitting show/hide toggle', () => {
    const markup = renderToStaticMarkup(<PasswordField id="password" label="Password" />);

    expect(markup).toContain('type="password"');
    expect(markup).toContain('<button type="button"');
    expect(markup).toContain('aria-label="Show password"');
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).toContain('for="password"');
  });

  it('shows a red border and mismatch hint while the confirm value differs', () => {
    const markup = renderToStaticMarkup(
      <PasswordField
        id="confirmPassword"
        label="Confirm Password"
        value="pass1234"
        matchValue="pass12"
        onChange={() => {}}
      />
    );

    expect(markup).toContain('Passwords do not match');
    expect(markup).toContain('border-[#CC0000]');
    expect(markup).toContain('aria-invalid="true"');
  });

  it('shows a green border and confirmation once the values match', () => {
    const markup = renderToStaticMarkup(
      <PasswordField
        id="confirmPassword"
        label="Confirm Password"
        value="pass1234"
        matchValue="pass1234"
        onChange={() => {}}
      />
    );

    expect(markup).toContain('Passwords match');
    expect(markup).toContain('border-emerald-500');
    expect(markup).not.toContain('Passwords do not match');
  });

  it('stays neutral while the confirm field is still empty', () => {
    const markup = renderToStaticMarkup(
      <PasswordField
        id="confirmPassword"
        label="Confirm Password"
        value=""
        matchValue="pass1234"
        onChange={() => {}}
      />
    );

    expect(markup).toContain('border-slate-300');
    expect(markup).not.toContain('Passwords do not match');
    expect(markup).not.toContain('Passwords match');
  });

  it('renders the live length requirement checklist', () => {
    const unmet = renderToStaticMarkup(
      <PasswordField
        id="password"
        label="Password"
        showRequirement
        value="short"
        onChange={() => {}}
      />
    );
    const met = renderToStaticMarkup(
      <PasswordField
        id="password"
        label="Password"
        showRequirement
        value="longenough"
        onChange={() => {}}
      />
    );

    expect(unmet).toContain('At least 8 characters');
    expect(unmet).toContain('text-slate-500');
    expect(met).toContain('At least 8 characters');
    expect(met).toContain('text-emerald-600');
  });

  it('wires the error message to the input via aria-describedby', () => {
    const markup = renderToStaticMarkup(
      <PasswordField id="password" label="Password" error="Password is required" />
    );

    expect(markup).toContain('aria-describedby="password-error"');
    expect(markup).toContain('id="password-error"');
    expect(markup).toContain('Password is required');
  });
});
