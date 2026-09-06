# 247Sparkle Setup and Deployment Handoff

## Supported architecture

247Sparkle uses Next.js API routes, Prisma, and **Supabase PostgreSQL**. All application database access is server-side through the dedicated Prisma database role. Supabase browser-client roles do not have table access because server-only RLS is enabled.

| Runtime concern | Supported approach |
| --- | --- |
| Local app port | `4028` through `npm run dev` |
| Runtime database traffic | Supabase transaction pooler through `DATABASE_URL` on port `6543` with `pgbouncer=true` |
| Prisma migrations | Direct connection or Supabase session pooler through `DIRECT_URL` on port `5432` |
| Data isolation | Separate development/test and production environments; no test records in production |
| Payments | Paystack test mode in test environments only until formal live-payment approval |

## Prerequisites

Install the repository-supported Node.js and npm versions, then obtain an **isolated development or test** Supabase environment. Do not use the production Supabase project for first-run setup, seed data, migrations, or automated tests.

```bash
node --version
npm --version
npm ci
npx prisma generate
```

The project declares Node.js `>=22.13.0 <23` and npm `10.9.x` in `package.json`.

## Configure secrets safely

Create a local secret file or configure your hosting provider’s environment manager with the variable names listed in [ENVIRONMENT_REFERENCE.md](./ENVIRONMENT_REFERENCE.md). The committed repository contains no usable database, JWT, or Paystack secrets.

Use the Supabase **Connect** panel to obtain environment-specific connection strings. The expected routing is:

| Secret | Use |
| --- | --- |
| `DATABASE_URL` | Runtime pooled application connection |
| `DIRECT_URL` | Prisma migrations and introspection |
| `JWT_SECRET` | Server-only signing key generated with `openssl rand -base64 48` |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | Test-mode pair in test environments; no live keys during development |
| `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_API_URL` | Exact public URL for the active environment |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Administrator bootstrap input; both are mandatory for a production seed create |

## Apply migrations and seed data

After confirming that the target is isolated, apply the committed migration history using the direct/session connection and regenerate Prisma Client.

```bash
npx prisma migrate deploy
npx prisma generate
```

Run `npm run db:seed` only against an isolated development or test environment. The seed creates missing administrator and default pricing records. It skips all demo users, known demo passwords, orders, and certificates whenever `NODE_ENV=production`, even if another flag requests demo data.

> Do not use `prisma db push --force-reset`, `migrate reset`, or a seed command against production. Schema changes must arrive as reviewed migrations, and business pricing must be protected from incidental seed rewrites.

## Run and verify locally

```bash
npm run dev
```

Open [http://localhost:4028](http://localhost:4028). Confirm the application process with `GET /api/health`; confirm the configured database with `GET /api/readiness`.

| Endpoint | Expected meaning |
| --- | --- |
| `/api/health` | `200` indicates the application process can answer requests. |
| `/api/readiness` | `200` indicates the database check passed; `503` indicates a generic dependency failure without exposing credentials or stack traces. |

## Test before handoff

Run these checks from a clean working tree. The first group does not require a database; the local integration suite requires only the guarded local `sparkle247_test` database documented in [LOCAL_INTEGRATION_TESTING.md](./LOCAL_INTEGRATION_TESTING.md).

```bash
npm test
npm run test:integration
npm run type-check
npm run lint
npm run build
```

For manual workflow coverage, follow [TESTING.md](./TESTING.md). Do not attempt a real Paystack transaction until the owner provides a matching pair of **test-mode** keys through the approved secret channel.

## Netlify production handoff

`netlify.toml` uses `npm run build` and `@netlify/plugin-nextjs`. Configure the environment variables in the Netlify site settings; do not place them in source control. The production launch remains an owner-controlled publishing action.

Before publishing, verify the following:

| Check | Completion condition |
| --- | --- |
| Database | The production Prisma role, pooled runtime URL, direct migration URL, RLS posture, and health probe are verified. |
| Data | A Supabase backup-and-restore rehearsal has succeeded in a non-production restore target. |
| Payments | Paystack test-mode initialization, verification, signed webhook, replay, and failure behavior are recorded. |
| Operations | Structured production logs are visible in the host and `/api/readiness` is monitored. |
| Release | The release commit passes the commands above and has a documented rollback target. |

## Troubleshooting

| Symptom | Safe action |
| --- | --- |
| `/api/readiness` returns `503` | Review the structured `readiness_check_failed` log event and confirm the environment’s database secret configuration without printing it. |
| Prisma command cannot connect | Confirm `DIRECT_URL` targets the intended isolated environment and uses a compatible direct/session connection. |
| Runtime requests fail under load | Confirm `DATABASE_URL` uses the Supabase transaction pooler with `pgbouncer=true`. |
| Seed command fails | Confirm the target is development/test, check for existing records, and avoid forcing a reset of production data. |
| Payment validation is blocked | Keep mocked tests running; resume real test-mode validation only when the owner safely provides test credentials. |
