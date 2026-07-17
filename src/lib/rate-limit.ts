// Fixed-window in-memory rate limiter.
//
// Scope: per server instance / edge isolate. On a single-server deploy this is
// a real global limit; on serverless it is per-instance, which still blunts
// brute-force attacks (each instance enforces the window independently).
// If the app moves to a multi-instance serverless platform and auth abuse
// becomes a concern, swap this for a shared store (e.g. Upstash Redis) —
// the call site in middleware.ts doesn't need to change.

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

// Cap map growth: prune expired windows opportunistically once it gets large.
const PRUNE_THRESHOLD = 10_000;

function prune(now: number) {
  if (windows.size < PRUNE_THRESHOLD) return;
  for (const [key, w] of windows) {
    if (w.resetAt <= now) windows.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the window resets — for the Retry-After header. */
  retryAfterSeconds: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  prune(now);

  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
