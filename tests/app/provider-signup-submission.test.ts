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
    '%s signup uses client-side invalid-submission feedback before calling the protected API route',
    (_, pagePath) => {
      const source = readFileSync(pagePath, 'utf8');

      expect(source).toMatch(
        /<form\s+noValidate\s+onSubmit=\{handleSubmit\(onSubmit, onInvalid\)\}/
      );
      expect(source).toMatch(/method:\s*'POST'/);
      expect(source).toContain("mode: 'onBlur'");
      expect(source).toContain('shouldFocusError: true');
      expect(source).toContain('setFocus(firstInvalidField)');
      expect(source).toContain('aria-invalid');
      expect(source).toContain('role="alert"');
    }
  );

  it.each([
    ['rider', riderSignupPage],
    ['partner', partnerSignupPage],
  ])('%s signup renders password inputs through the shared PasswordField component', (_, page) => {
    const source = readFileSync(page, 'utf8');

    expect(source).toContain("from '@/components/ui/PasswordField'");
    expect(source).toContain('matchValue={passwordValue}');
    expect(source).not.toContain('type="password"');
  });

  it('requires rider and partner passwords of at least 8 characters', () => {
    const riderBase = {
      fullName: 'John Rider',
      email: 'rider@example.com',
      phone: '08012345678',
      address: '14 Upu Road, Otukpo',
    };
    const partnerBase = {
      businessName: 'Sparkle Laundry Hub',
      ownerName: 'Jane Partner',
      email: 'partner@example.com',
      phone: '08012345678',
      address: '24 Commercial Avenue, Otukpo',
      openingTime: '08:00',
      closingTime: '18:00',
    };

    const shortRider = riderSignupSchema.safeParse({
      ...riderBase,
      password: 'pass123',
      confirmPassword: 'pass123',
    });
    const shortPartner = partnerSignupSchema.safeParse({
      ...partnerBase,
      password: 'pass123',
      confirmPassword: 'pass123',
    });

    expect(shortRider.success).toBe(false);
    expect(shortPartner.success).toBe(false);
    if (!shortRider.success) {
      expect(shortRider.error.issues.map((issue) => issue.message)).toContain(
        'Password must be at least 8 characters'
      );
    }
    if (!shortPartner.success) {
      expect(shortPartner.error.issues.map((issue) => issue.message)).toContain(
        'Password must be at least 8 characters'
      );
    }

    expect(
      riderSignupSchema.safeParse({
        ...riderBase,
        password: 'pass1234',
        confirmPassword: 'pass1234',
      }).success
    ).toBe(true);
    expect(
      partnerSignupSchema.safeParse({
        ...partnerBase,
        password: 'pass1234',
        confirmPassword: 'pass1234',
      }).success
    ).toBe(true);
  });

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

  it('accepts valid rider signup with facePhotoUrl', () => {
    const result = riderSignupSchema.safeParse({
      fullName: 'John Rider',
      email: 'rider@example.com',
      phone: '08012345678',
      address: '14 Upu Road, Otukpo',
      facePhotoUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.facePhotoUrl).toBe(
        'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg'
      );
    }
  });

  it('accepts valid partner signup with ownerPhotoUrl', () => {
    const result = partnerSignupRequestSchema.safeParse({
      businessName: 'Sparkle Laundry Hub',
      ownerName: 'Jane Partner',
      email: 'partner@example.com',
      phone: '08012345678',
      address: '24 Commercial Avenue, Otukpo',
      ownerPhotoUrl: 'https://res.cloudinary.com/demo/image/upload/v1/owner.jpg',
      openingTime: '08:00',
      closingTime: '18:00',
      daysOfOpening: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ownerPhotoUrl).toBe(
        'https://res.cloudinary.com/demo/image/upload/v1/owner.jpg'
      );
    }
  });
});
