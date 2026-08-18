import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(__dirname, '..', '..');
const riderSignupPage = resolve(projectRoot, 'src/app/rider/signup/page.tsx');
const partnerSignupPage = resolve(projectRoot, 'src/app/partner/signup/page.tsx');

describe('provider signup submission safeguards', () => {
  it.each([
    ['rider', riderSignupPage],
    ['partner', partnerSignupPage],
  ])(
    '%s signup explicitly uses POST while the client handler calls the protected API route',
    (_, pagePath) => {
      const source = readFileSync(pagePath, 'utf8');

      expect(source).toMatch(/<form\s+method="post"\s+onSubmit=\{handleSubmit\(onSubmit\)\}/);
      expect(source).toMatch(/method:\s*'POST'/);
    }
  );
});
