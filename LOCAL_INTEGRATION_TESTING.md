# Local Integration Testing

## Purpose and safety boundary

This repository has an opt-in integration suite for the highest-risk 247Sparkle server workflows. It runs against a **local PostgreSQL database named `sparkle247_test` only**. It does not use `DATABASE_URL`, `DIRECT_URL`, or data from the Supabase runtime environment.

The runner loads `TEST_DATABASE_URL` from `.env.test.local`, validates that its database name is exactly `sparkle247_test`, and rejects non-local hosts. The Vitest setup repeats the same check before it can truncate data. These two checks are deliberate safeguards against running destructive test cleanup against Supabase or any production database.

> The local integration lane is free and suitable for development regression testing. A hosted Supabase branch remains a separate future pre-launch validation step when an isolated cloud environment is available.

## One-time local PostgreSQL setup

The following commands are for a Debian/Ubuntu development machine with PostgreSQL 16 installed. They create a database owned by the local operating-system user, allowing Prisma to connect through the local Unix socket without a cloud credential.

```bash
sudo -u postgres psql -c "CREATE ROLE $USER LOGIN;"
sudo -u postgres createdb -O "$USER" sparkle247_test
cp integration-test.example .env.test.local
```

If the PostgreSQL service is not already running, start the local cluster before running tests. Do not replace the example connection with a Supabase, Netlify, Neon, Paystack, or production connection string.

## Commands

| Command                          | Effect                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `npm test`                       | Runs the fast unit and mocked regression suite only. It never loads the local integration database.                            |
| `npm run test:integration:reset` | Destructively resets **only** the guarded local `sparkle247_test` database and reapplies Prisma migrations.                    |
| `npm run test:integration`       | Generates Prisma Client, applies pending migrations to the guarded local database, and runs database-backed integration tests. |

The integration tests clear their local fixtures before each test. The reset command is useful after a schema or migration change, while the ordinary integration command is the expected day-to-day regression check.

## Current workflow coverage

| Area              | Behavior exercised against PostgreSQL                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Customer orders   | Session role enforcement, server-side price lookup, kobo-safe total persistence, external payment reference persistence, payment-init failure recovery, and customer-only order lists. |
| Payment integrity | Concurrent duplicate settlement produces one payment ledger event, one audit event, and one paid order transition.                                                                     |
| Rider fulfilment  | Approval gate, URL/body order-ID matching, atomic single claim, duplicate claim conflict, owner-only rider status changes, invalid transition rejection, and admin status override.    |
| Login/session     | Bcrypt-backed customer login, `HttpOnly` session-cookie creation, token verification, and invalid-password rejection.                                                                  |
| Middleware        | Anonymous API rejection, role matrix enforcement, mutating cross-origin rejection, and removal/replacement of spoofed identity headers.                                                |

External Paystack requests are intentionally mocked at the client boundary in this suite. Real Paystack test-mode checkout, signed webhooks, and provider callbacks remain paused until the site owner can supply test-only credentials.
