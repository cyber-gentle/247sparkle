import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getOperatingDaysError,
  partnerSignupSchema,
  partnerSignupRequestSchema,
  riderSignupSchema,
} from '@/lib/provider-signup-validation';

const projectRoot = resolve(__dirname, '..', '..');
const riderSignupPage = resolve(projectRoot, 'src/app/rider/signup/page.tsx');
const partnerSignupPage = resolve(projectRoot, 'src/app/partner/signup/page.tsx');

describe('provider signup submission safeguards', () => {
  it.each([
    ['rider', riderSignupPage],
    ['partner', partnerSignupPage],
  ])(
    '%s signup uses POST with client-side invalid-submission feedback before calling the protected API route',
    (_, pagePath) => {
      const source = readFileSync(pagePath, 'utf8');

      expect(source).toMatch(
        /<form\s+method="post"\s+noValidate\s+onSubmit=\{handleSubmit\(onSubmit, onInvalid\)\}/
      );
      expect(source).toMatch(/method:\s*'POST'/);
      expect(source).toContain("mode: 'onBlur'");
      expect(source).toContain('shouldFocusError: true');
      expect(source).toContain('setFocus(firstInvalidField)');
      expect(source).toContain('aria-invalid');
      expect(source).toContain('role="alert"');
    }
  );

  it('requires partners to choose at least one operating day before their application is sent', () => {
    expect(getOperatingDaysError([])).toBe('Select at least one day your business is open.');
    expect(getOperatingDaysError(['Mon'])).toBeNull();
  });

  it('rejects blank and whitespace-only rider application fields', () => {
    const result = riderSignupSchema.safeParse({
      fullName: ' ',
      email: ' ',
      phone: ' ',
      address: ' ',
      password: '',
      confirmPassword: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain('Full name is required');
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        'Pickup-area address is required'
      );
      expect(result.error.issues.map((issue) => issue.message)).toContain('Password is required');
    }
  });

  it('rejects blank partner profile, schedule, and credential fields', () => {
    const result = partnerSignupSchema.safeParse({
      businessName: ' ',
      ownerName: ' ',
      email: ' ',
      phone: ' ',
      address: ' ',
      openingTime: '',
      closingTime: '',
      password: '',
      confirmPassword: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        'Business name is required'
      );
      expect(result.error.issues.map((issue) => issue.message)).toContain('Owner name is required');
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        'Business address is required'
      );
      expect(result.error.issues.map((issue) => issue.message)).toContain('Password is required');
    }
  });

  it('rejects partner signup requests without an operating day', () => {
    expect(
      partnerSignupRequestSchema.safeParse({
        businessName: '247Sparkle Partner',
        ownerName: 'Business Owner',
        email: 'partner@example.com',
        phone: '08012345678',
        address: '1 Main Street, Otukpo',
        openingTime: '08:00',
        closingTime: '17:00',
        password: 'password123',
        confirmPassword: 'password123',
        daysOfOpening: [],
      }).success
    ).toBe(false);
  });
});
