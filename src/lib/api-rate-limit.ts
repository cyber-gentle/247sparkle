import prisma from '@/lib/db';
import { NextResponse, type NextRequest } from 'next/server';

export type RateLimitPolicy = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const localWindows = new Map<string, { count: number; resetAt: number }>();

export const RATE_LIMIT_POLICIES = {
  auth: { limit: 10, windowMs: 60_000 },
  certificateLookup: { limit: 20, windowMs: 60_000 },
  paymentVerification: { limit: 10, windowMs: 60_000 },
  mutation: { limit: 60, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitPolicy>;

export function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function limitInMemory(key: string, policy: RateLimitPolicy): RateLimitResult {
  const now = Date.now();
  const existing = localWindows.get(key);

  if (!existing || existing.resetAt <= now) {
    localWindows.set(key, { count: 1, resetAt: now + policy.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  return existing.count <= policy.limit
    ? { allowed: true, retryAfterSeconds: 0 }
    : { allowed: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
}

export async function enforceRateLimit(
  key: string,
  policy: RateLimitPolicy
): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + policy.windowMs);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.rateLimitBucket.findUnique({ where: { key } });
      const bucket =
        !current || current.resetAt <= now
          ? await tx.rateLimitBucket.upsert({
              where: { key },
              create: { key, count: 1, resetAt },
              update: { count: 1, resetAt },
            })
          : await tx.rateLimitBucket.update({
              where: { key },
              data: { count: { increment: 1 } },
            });

      return { count: bucket.count, resetAt: bucket.resetAt };
    });

    return result.count <= policy.limit
      ? { allowed: true, retryAfterSeconds: 0 }
      : {
          allowed: false,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((result.resetAt.getTime() - now.getTime()) / 1000)
          ),
        };
  } catch {
    // Local development and temporary database outages retain a bounded fallback.
    return limitInMemory(key, policy);
  }
}

export async function rateLimitRequest(
  request: NextRequest,
  scope: string,
  policy: RateLimitPolicy
): Promise<NextResponse | null> {
  const result = await enforceRateLimit(`${scope}:${getClientIp(request.headers)}`, policy);
  return result.allowed
    ? null
    : NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } }
      );
}
