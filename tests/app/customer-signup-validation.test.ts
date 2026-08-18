import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { customerSignupSchema } from '@/lib/customer-signup-validation';

const projectRoot = resolve(__dirname, '..', '..');
const customerSignupPage = resolve(projectRoot, 'src/app/customer/signup/page.tsx');

describe('customer signup validation safeguards', () => {
  it('rejects blank and whitespace-only required values', () => {
    const result = customerSignupSchema.safeParse({
      fullName: ' ',
      email: ' ',
      phone: ' ',
      password: '',
      confirmPassword: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain('Full name is required');
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        'Email address is required'
      );
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        'Phone number is required'
      );
      expect(result.error.issues.map((issue) => issue.message)).toContain('Password is required');
    }
  });

  it('uses POST with visible client-side invalid-submission feedback', () => {
    const source = readFileSync(customerSignupPage, 'utf8');

    expect(source).toMatch(
      /<form\s+method="post"\s+noValidate\s+className="space-y-4"\s+onSubmit=\{handleSubmit\(onSubmit, onInvalid\)\}/
    );
    expect(source).toContain("mode: 'onBlur'");
    expect(source).toContain('shouldFocusError: true');
    expect(source).toContain('setFocus(firstInvalidField)');
    expect(source).toContain('aria-invalid');
    expect(source).toContain('role="alert"');
  });

  it('keeps the customer signup panel visibly branded and service-oriented', () => {
    const source = readFileSync(customerSignupPage, 'utf8');

    expect(source).toContain('!bg-[#1A0A5E]');
    expect(source).toContain('CUSTOMER_JOURNEY');
    expect(source).toContain('Your service journey');
    expect(source).toContain('Choose a service');
  });
});
