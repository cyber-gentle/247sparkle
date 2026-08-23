import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/lib/logger';

describe('structured logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('emits machine-readable JSON and redacts sensitive fields recursively', () => {
    const output = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    logger.error('login_failed', {
      email: 'customer@example.test',
      password: 'not-safe-to-log',
      nested: { authorization: 'Bearer secret', orderId: 'order-123' },
      error: new Error('Invalid password'),
    });

    expect(output).toHaveBeenCalledTimes(1);
    const log = JSON.parse(String(output.mock.calls[0][0]));
    expect(log).toMatchObject({
      level: 'error',
      event: 'login_failed',
      service: '247Sparkle',
      metadata: {
        email: '[REDACTED]',
        password: '[REDACTED]',
        nested: { authorization: '[REDACTED]', orderId: 'order-123' },
        error: { name: 'Error', message: 'Invalid password' },
      },
    });
    expect(JSON.stringify(log)).not.toContain('not-safe-to-log');
    expect(JSON.stringify(log)).not.toContain('Bearer secret');
  });
});
