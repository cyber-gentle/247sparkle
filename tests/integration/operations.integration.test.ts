import { describe, expect, it } from 'vitest';
import { checkReadiness } from '@/lib/health';

describe('database-backed operations baseline', () => {
  it('reports ready when the guarded local PostgreSQL integration database is reachable', async () => {
    await expect(checkReadiness()).resolves.toEqual({
      ready: true,
      checks: { database: 'ok' },
    });
  });
});
