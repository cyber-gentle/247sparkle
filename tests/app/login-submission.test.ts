import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(__dirname, '..', '..');

const loginPages = [
  ['administrator', 'src/app/admin/login/page.tsx', '/api/auth/admin/login'],
  ['customer', 'src/app/customer/login/page.tsx', '/api/auth/customer/login'],
  ['partner', 'src/app/partner/login/page.tsx', '/api/auth/partner/login'],
  ['rider', 'src/app/rider/login/page.tsx', '/api/auth/rider/login'],
] as const;

describe('credential login submission safeguards', () => {
  it.each(loginPages)(
    '%s login uses client-side fetch submission via onSubmit handler',
    (_, page, apiPath) => {
      const source = readFileSync(resolve(projectRoot, page), 'utf8');

      expect(source).toMatch(/<form\s+onSubmit=\{handleSubmit\(onSubmit\)\}/);
      expect(source).toContain(`fetch('${apiPath}'`);
      expect(source).toMatch(/method:\s*'POST'/);
    }
  );
});
