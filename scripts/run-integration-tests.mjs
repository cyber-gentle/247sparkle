import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { config } from 'dotenv';

const envFile = process.env.INTEGRATION_ENV_FILE || '.env.test.local';

if (existsSync(envFile)) {
  config({ path: envFile, override: false });
}

const databaseUrl = process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
  console.error(
    `Missing TEST_DATABASE_URL. Copy integration-test.example to ${envFile} and use only the local sparkle247_test database.`
  );
  process.exit(1);
}

function assertLocalTestDatabase(value) {
  const parsed = new URL(value);
  const socketHost = parsed.searchParams.get('host');
  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  const usesLocalSocket = socketHost === '/var/run/postgresql';

  if ((!isLocalHost && !usesLocalSocket) || parsed.pathname !== '/sparkle247_test') {
    throw new Error(
      'Refusing to run integration tests: TEST_DATABASE_URL must target only a local sparkle247_test database.'
    );
  }
}

assertLocalTestDatabase(databaseUrl);

const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DIRECT_URL: databaseUrl,
  INTEGRATION_TESTS: 'true',
};

function run(command, args) {
  const result = spawnSync(command, args, { cwd: process.cwd(), env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const shouldReset = process.argv.includes('--reset');

run('npx', ['prisma', 'generate']);
run(
  'npx',
  shouldReset
    ? ['prisma', 'migrate', 'reset', '--force', '--skip-seed']
    : ['prisma', 'migrate', 'deploy']
);

if (!shouldReset) {
  run('npx', ['vitest', 'run', '--config', 'vitest.integration.config.ts']);
}
