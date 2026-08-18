# Supabase PostgreSQL Setup for 247Sparkle

## Purpose

**Supabase PostgreSQL is the supported database provider for 247Sparkle.** The
application uses Prisma and requires two connection settings when deployed to
a serverless environment:

| Setting        | Purpose                             | Supabase connection type                                                 |
| -------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| `DATABASE_URL` | Runtime application queries         | Supavisor **transaction pooler**, port `6543`, with `pgbouncer=true`     |
| `DIRECT_URL`   | Prisma migrations and introspection | Direct database connection, or Supavisor **session pooler**, port `5432` |

This split lets application instances use pooled connections while migration
commands keep a stable database connection. Supabase documents the Prisma
integration and connection choices in its [Prisma guide](https://supabase.com/docs/guides/database/prisma); Prisma provides the corresponding
[Supabase connection guidance](https://www.prisma.io/docs/orm/v6/overview/databases/supabase).

## Environment separation

Create distinct Supabase projects or otherwise fully isolated environments for
development/test and production. The **test** environment is the only one
permitted for seed records, schema verification, mocked Paystack webhooks, and
Paystack test-mode financial tests.

| Environment      | Permitted activity                                         | Payment credentials                                      |
| ---------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| Development/test | Migrations, seeds, integration tests, webhook replay tests | Paystack test-mode only                                  |
| Production       | Approved migrations and real customer traffic              | Live credentials only after operational readiness review |

## Configure the Supabase database user

In the Supabase SQL editor, create a dedicated Prisma database role and grant
only the privileges required by Prisma over the `public` schema. Supabase's
official Prisma guide provides the role and grant statements. Store the role
password in the environment manager, not in this repository.

## Configure environment variables

In Supabase, select **Connect** and copy the appropriate connection strings.
Set the following values in the local secret store or hosting provider’s
environment-variable settings:

```text
DATABASE_URL=postgresql://prisma.<project-ref>:<password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://prisma:<password>@db.<project-ref>.supabase.co:5432/postgres
JWT_SECRET=<a-high-entropy-secret>
PAYSTACK_SECRET_KEY=<test-key-for-test-environment>
PAYSTACK_PUBLIC_KEY=<matching-test-public-key>
NEXT_PUBLIC_SITE_URL=http://localhost:4028
NEXT_PUBLIC_API_URL=http://localhost:4028/api
```

The examples are patterns, not credentials. Supabase project references,
regions, roles, and hostnames differ per project. Do not paste actual values
into documentation, source files, commits, issue trackers, or chat.

> **Legacy template notice:** The committed `.env.example` still contains a
> historical Neon connection example. It is not the source of truth for this
> Supabase deployment. Use the variable names and Supabase connection patterns
> in this guide, then place real values only in the approved secret store.

## Apply the committed migrations safely

First target the isolated Supabase **test** database and make sure the values
above resolve there. Then apply the existing migration history exactly once:

```bash
npx prisma migrate deploy
npx prisma generate
```

The Phase 2 financial-integrity and Phase 3 security migrations must both be
applied before integration tests run. Confirm the test database is isolated
before the command: `migrate deploy` changes schema state and is not a dry run.

## Server-only row-level security

247Sparkle is designed to use its own Next.js API and Prisma connection for
all application data access. The `20260817_server_only_rls` migration enables
Row Level Security (RLS) on every application table and intentionally creates
**no** policies for Supabase browser-client roles. Consequently, a Supabase
publishable/anon or authenticated client cannot read or mutate application
tables directly.

The trusted Prisma database user must remain a server-side credential with the
necessary database privileges; it must never be shipped to the browser. If a
future feature needs a Supabase client to access tables directly, design and
review narrow, role-aware RLS policies first. Do not add permissive policies
such as `USING (true)` merely to make a client request work.

## Financial integration-test gate

Before running the next integration-test sprint, provide a disposable Supabase
test `DATABASE_URL` and a Paystack **test-mode** secret key through the
approved secret channel. The test suite will verify payment-event idempotency,
rider-acceptance concurrency, and permitted order transitions without touching
production payments or production customer records.

## References

1. [Supabase: Prisma integration guide](https://supabase.com/docs/guides/database/prisma)
2. [Prisma: Supabase database guide](https://www.prisma.io/docs/orm/v6/overview/databases/supabase)
