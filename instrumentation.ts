import { installStructuredConsoleBridge, logger } from '@/lib/logger';

declare global {
  // eslint-disable-next-line no-var
  var __sparkleOperationsHooksInstalled: boolean | undefined;
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge' || globalThis.__sparkleOperationsHooksInstalled) return;

  globalThis.__sparkleOperationsHooksInstalled = true;

  if (process.env.NODE_ENV === 'production' || process.env.STRUCTURED_LOGGING === 'true') {
    installStructuredConsoleBridge();
  }

  process.on('unhandledRejection', (reason) => {
    logger.error('unhandled_rejection', { reason });
  });

  process.on('uncaughtException', (error) => {
    logger.error('uncaught_exception', { error });
  });

  logger.info('server_runtime_initialized', {
    structuredConsoleBridge:
      process.env.NODE_ENV === 'production' || process.env.STRUCTURED_LOGGING === 'true',
  });
}
