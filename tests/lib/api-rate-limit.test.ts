import { describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  $transaction: vi.fn().mockRejectedValue(new Error('database unavailable')),
}));

vi.mock('@/lib/db', () => ({ default: database }));

import { enforceRateLimit } from '../../src/lib/api-rate-limit';

describe('shared rate-limit interface', () => {
  it('uses a bounded local fallback when the shared database store is unavailable', async () => {
    const policy = { limit: 1, windowMs: 60_000 };

    await expect(enforceRateLimit('test:fallback-key', policy)).resolves.toMatchObject({
      allowed: true,
    });
    await expect(enforceRateLimit('test:fallback-key', policy)).resolves.toMatchObject({
      allowed: false,
    });
  });
});
