import prisma from '@/lib/db';

export type ReadinessResult = {
  ready: boolean;
  checks: {
    database: 'ok' | 'failed';
  };
};

const DATABASE_CHECK_TIMEOUT_MS = 2_000;

export async function checkReadiness(): Promise<ReadinessResult> {
  try {
    const databaseCheck = prisma.$queryRaw`SELECT 1`;
    await Promise.race([
      databaseCheck,
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Database readiness check timed out')),
          DATABASE_CHECK_TIMEOUT_MS
        );
      }),
    ]);
    return { ready: true, checks: { database: 'ok' } };
  } catch {
    return { ready: false, checks: { database: 'failed' } };
  }
}
