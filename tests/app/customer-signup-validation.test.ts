import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { customerSignupSchema } from '@/lib/customer-signup-validation';

const projectRoot = resolve(__dirname, '..', '..');
const customerSignupPage = resolve(projectRoot, 'src/app/customer/signup/page.tsx');

describe('customer signup validation safeguards', () => {
  it('rejects blank and whitespace-only required values', () => {
    expect(
      customerSignupSchema.safeParse({
        fullName: ' ',
        email: ' ',
        phone: ' ',
        password: '',
        confirmPassword: '',
      }).success
    ).toBe(false);
  });

  it('uses POST with visible client-side invalid-submission feedback', () => {
    const source = readFileSync(customerSignupPage, 'utf8');

    expect(source).toMatch(
      /<form\s+method="post"\s+noValidate\s+className="space-y-4"\s+onSubmit=\{handleSubmit\(onSubmit, onInvalid\)\}/
    );
    expect(source).toContain("mode: 'onBlur'");
    expect(source).toContain('aria-invalid');
    expect(source).toContain('role="alert"');
  });
});
