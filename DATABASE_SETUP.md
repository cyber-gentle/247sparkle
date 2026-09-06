# 247Sparkle Database Setup

## Source of truth

247Sparkle uses **Prisma with Supabase PostgreSQL** in every supported environment. SQLite is not supported by the current schema, migrations, RLS posture, financial-integrity controls, or local integration suite.

> The legacy SQLite instructions have been retired. Do not create `prisma/dev.db`, switch the datasource provider, or use SQLite reset commands for this project.

## Connection model

Prisma needs two server-only URLs in deployed environments.

| Variable | Connection type | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Supabase Supavisor transaction pooler, port `6543`, with `pgbouncer=true` | Runtime API and application queries |
| `DIRECT_URL` | Supabase direct connection or session pooler, port `5432` | Prisma migrations and introspection |

The local integration suite uses a distinct, guarded PostgreSQL database called `sparkle247_test`. It is not a substitute for a hosted Supabase test-environment rehearsal.

## Safe environment separation

| Environment | Allowed activity | Prohibited activity |
| --- | --- | --- |
| Local integration | Disposable schema resets and database-backed automated tests | Production credentials or customer data |
| Supabase development/test | Migrations, controlled seeds, test-mode Paystack checks, RLS/runtime role validation | Live payment keys or production customer data |
| Production | Approved migrations, real traffic, monitored readiness checks | Demo records, known test passwords, destructive resets, unreviewed schema changes |

## Migration procedure

First confirm that `DIRECT_URL` identifies the intended isolated Supabase environment. Then apply the committed migration history:

```bash
npx prisma migrate deploy
npx prisma generate
```

Do not use `prisma db push` for a managed production release. Do not use `migrate reset`, `db push --force-reset`, or manual table deletion against production.

## Server-only RLS posture

The `20260817_server_only_rls` migration enables RLS for all application tables. No browser-client Supabase policies are created because application data is accessed through server-side Next.js routes and the dedicated Prisma role.

The Prisma role, `DATABASE_URL`, and `DIRECT_URL` are server-only secrets. Never send them to the browser, include them in a public API response, or copy them into documentation or tickets.

## Seed policy

`npm run db:seed` creates missing administrator and default pricing records. The command never imports demo accounts, demo certificates, known demo passwords, or fictitious customer records when `NODE_ENV=production`.

The seed is a bootstrap tool, not a production data-management tool. Do not use it to change live prices or reset business records. Price changes must use the authorized administration workflow.

## Validation

| Check | Command or endpoint |
| --- | --- |
| Prisma Client generation | `npx prisma generate` |
| Applied migration history | `npx prisma migrate deploy` |
| Local database-backed suite | `npm run test:integration` |
| Application liveness | `GET /api/health` |
| Database readiness | `GET /api/readiness` |

For the full connection, role, RLS, and payment test gate, read [SUPABASE_SETUP.md](./SUPABASE_SETUP.md). For production operating procedures, read [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md).
