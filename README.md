# 247Sparkle

247Sparkle is a multi-role laundry, cleaning, fumigation, delivery, and partner-management platform. It provides customer booking and order tracking, rider job fulfilment, partner onboarding, administration, pricing management, and fumigation certificate verification.

## Current release posture

247Sparkle is a **pre-production release candidate**. Its codebase has a release baseline, financial-order integrity controls, role-based API access, a guarded local PostgreSQL integration suite, and production liveness/readiness operations checks. Live launch remains blocked on real Paystack **test-mode** validation, a hosted Supabase test-environment rehearsal, backup/restore validation, and a dedicated dependency-upgrade branch.

| Area | Current approach |
| --- | --- |
| Application | Next.js 15 App Router, React 19, TypeScript, and Tailwind CSS |
| Database | Prisma with Supabase PostgreSQL |
| Authentication | Server-side HS256 JWT in an HttpOnly `auth_token` cookie |
| Payments | Paystack integration; real-provider testing is paused until the owner supplies test-only keys |
| Runtime checks | `GET /api/health` and `GET /api/readiness` |
| Local integration tests | Guarded, disposable PostgreSQL database named `sparkle247_test` |

## Quick start

Use Node.js `22.13.x` and npm `10.9.x` as declared by the repository. Install dependencies with the lockfile, configure an **isolated development or test database**, apply migrations there, and then start the server on the fixed local port.

```bash
npm ci
npx prisma generate
npm run dev
```

Open [http://localhost:4028](http://localhost:4028). Public pages and the liveness probe can load without a database, but authenticated pages and dynamic API routes require a configured development/test database.

> Never point local development, Prisma migrations, seeds, tests, or Paystack test mode at customer-facing production data.

## Environment and database configuration

The supported provider is **Supabase PostgreSQL**. Runtime application traffic uses the Supavisor transaction pooler, while Prisma migrations use a direct connection or the session pooler. Configure actual values only in a local secret file or the hosting provider secret store.

| Variable | Required use |
| --- | --- |
| `DATABASE_URL` | Runtime application connection through the Supabase transaction pooler on port `6543` with `pgbouncer=true` |
| `DIRECT_URL` | Prisma migration and introspection connection through a direct or session-pooler connection on port `5432` |
| `JWT_SECRET` | High-entropy server-side JWT signing secret |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | Matching test keys outside production; live keys only after all launch gates are complete |
| `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_API_URL` | Public origin and API origin for the active environment |
| `SEED_ADMIN_PASSWORD` | Required when creating a production seed administrator |

Read [ENVIRONMENT_REFERENCE.md](./ENVIRONMENT_REFERENCE.md) and [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) before configuring any connection. Do not commit a real connection string, payment key, JWT secret, or administrator password.

## Development, testing, and operations commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Starts the local application on port `4028`. |
| `npm test` | Runs the fast unit and regression suite without a database. |
| `npm run test:integration` | Runs the guarded local PostgreSQL integration suite. |
| `npm run test:integration:reset` | Destructively resets only the local `sparkle247_test` integration database. |
| `npm run type-check` | Runs the TypeScript quality check. |
| `npm run lint` | Runs linting; existing legacy warnings are tracked separately. |
| `npm run build` | Produces the production Next.js build. |
| `npm run db:seed` | Seeds an isolated development/test database only; production demo records are always blocked. |

The local integration setup is documented in [LOCAL_INTEGRATION_TESTING.md](./LOCAL_INTEGRATION_TESTING.md). The manual test matrix is in [TESTING.md](./TESTING.md). Operational probe and incident guidance is in [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md).

## Production handoff

The application is prepared for Netlify using `@netlify/plugin-nextjs`; publishing is intentionally a manual owner action. Before a production deployment, complete every release gate below.

| Release gate | Required evidence |
| --- | --- |
| Supabase runtime | Isolated test-environment rehearsal with the least-privilege Prisma role, migrations, RLS posture, and connection-pool configuration validated. |
| Payments | Paystack **test-mode** checkout, verification, signed webhook, duplicate callback, and failure-path validation. |
| Operations | Healthy `/api/health` and `/api/readiness` probes, structured logs in the selected host, and a successful Supabase backup-and-restore rehearsal. |
| Quality | Unit, local database integration, type, lint, and production-build checks pass for the release commit. |
| Dependencies | Production dependency audit findings are addressed on a separately tested upgrade branch. |

See [SETUP.md](./SETUP.md) for the complete development-to-production handoff and [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md) for monitoring and recovery expectations.
