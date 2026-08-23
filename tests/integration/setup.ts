import { afterAll, beforeEach } from 'vitest';
import prisma from '@/lib/db';

const testDatabaseUrl = process.env.DATABASE_URL;

if (process.env.INTEGRATION_TESTS !== 'true') {
  throw new Error('Integration tests must be started through npm run test:integration.');
}

if (!testDatabaseUrl) {
  throw new Error('Integration tests require DATABASE_URL.');
}

const parsedDatabaseUrl = new URL(testDatabaseUrl);
const socketHost = parsedDatabaseUrl.searchParams.get('host');
const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(parsedDatabaseUrl.hostname);

if (
  (!isLocalHost && socketHost !== '/var/run/postgresql') ||
  parsedDatabaseUrl.pathname !== '/sparkle247_test'
) {
  throw new Error('Integration tests refuse to touch a non-local or non-test database.');
}

async function clearTestDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "users",
      "pricing",
      "quotations",
      "audit_logs",
      "rate_limit_buckets"
    RESTART IDENTITY CASCADE
  `);
}

beforeEach(async () => {
  await clearTestDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
