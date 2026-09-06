import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const health = vi.hoisted(() => ({
  checkReadiness: vi.fn(),
}));
const logger = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock('@/lib/health', () => ({ checkReadiness: health.checkReadiness }));
vi.mock('@/lib/logger', () => ({ logger }));

import { GET as healthCheck } from '@/app/api/health/route';
import { GET as readinessCheck } from '@/app/api/readiness/route';
import { middleware } from '@/middleware';

describe('operations health endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a cache-safe public liveness response without touching the database', async () => {
    const response = await healthCheck();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store, max-age=0');
    expect(await response.json()).toMatchObject({ status: 'ok', service: '247Sparkle' });
    expect(health.checkReadiness).not.toHaveBeenCalled();
  });

  it('returns generic readiness state and logs a failed dependency without error details', async () => {
    health.checkReadiness.mockResolvedValue({ ready: false, checks: { database: 'failed' } });

    const response = await readinessCheck();

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      status: 'not_ready',
      service: '247Sparkle',
      checks: { database: 'failed' },
    });
    expect(logger.error).toHaveBeenCalledWith('readiness_check_failed', {
      checks: { database: 'failed' },
    });
  });

  it('returns a ready response when the database check succeeds', async () => {
    health.checkReadiness.mockResolvedValue({ ready: true, checks: { database: 'ok' } });

    const response = await readinessCheck();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: 'ready',
      checks: { database: 'ok' },
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('allows anonymous health and readiness probes through middleware', async () => {
    const [healthResponse, readinessResponse] = await Promise.all([
      middleware(new NextRequest('http://localhost:4028/api/health')),
      middleware(new NextRequest('http://localhost:4028/api/readiness')),
    ]);

    expect(healthResponse.status).toBe(200);
    expect(readinessResponse.status).toBe(200);
  });
});
