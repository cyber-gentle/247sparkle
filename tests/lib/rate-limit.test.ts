import { describe, expect, it } from 'vitest';
import { rateLimit } from '../../src/lib/rate-limit';

describe('rateLimit', () => {
  it('allows requests through the configured fixed-window limit', () => {
    const key = `allow-${Date.now()}-${Math.random()}`;

    expect(rateLimit(key, 2, 60_000)).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(rateLimit(key, 2, 60_000)).toEqual({ allowed: true, retryAfterSeconds: 0 });
  });

  it('rejects requests after the configured limit and returns a retry time', () => {
    const key = `deny-${Date.now()}-${Math.random()}`;

    rateLimit(key, 1, 60_000);
    const result = rateLimit(key, 1, 60_000);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(60);
  });
});
