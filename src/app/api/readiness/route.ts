import { NextResponse } from 'next/server';
import { checkReadiness } from '@/lib/health';
import { logger } from '@/lib/logger';

const noStoreHeaders = {
  'Cache-Control': 'no-store, max-age=0',
};

export async function GET() {
  const readiness = await checkReadiness();

  if (!readiness.ready) {
    logger.error('readiness_check_failed', { checks: readiness.checks });
  }

  return NextResponse.json(
    {
      status: readiness.ready ? 'ready' : 'not_ready',
      service: '247Sparkle',
      checks: readiness.checks,
      timestamp: new Date().toISOString(),
    },
    { status: readiness.ready ? 200 : 503, headers: noStoreHeaders }
  );
}
