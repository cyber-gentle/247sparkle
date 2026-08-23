import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const seedSource = readFileSync(path.resolve(process.cwd(), 'prisma/seed.ts'), 'utf8');

describe('production seed policy', () => {
  it('requires an explicit administrator password before production administrator creation', () => {
    expect(seedSource).toContain(
      'if (isProduction && (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD))'
    );
    expect(seedSource).toContain(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required when creating a production administrator.'
    );
  });

  it('always blocks demo records in production and does not reset existing business data', () => {
    expect(seedSource).toContain('if (isProduction) {');
    expect(seedSource).not.toContain("process.env.SEED_DEMO_DATA !== 'true'");
    expect(seedSource).toContain(
      'Existing administrator retained; seed will not reset its password.'
    );
    expect(seedSource).toContain('if (!existingPricing) {');
    expect(seedSource).toContain('Existing demo records retained; seed will not duplicate them.');
  });
});
