# 247Sparkle Environment Reference

## Secret handling rule

Use this file as a **name-and-purpose reference only**. Put real values in a local secret file or the configured hosting provider environment manager. Never commit real database URLs, JWT secrets, Paystack keys, administrator passwords, or Supabase role passwords.

| Variable | Required | Purpose | Environment rule |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled Supabase runtime connection | Transaction pooler on port `6543` with `pgbouncer=true`; server only |
| `DIRECT_URL` | Yes for Prisma commands | Direct/session connection for migrations and introspection | Port `5432`; server/CLI only |
| `JWT_SECRET` | Yes | Signs HttpOnly authentication cookies | Generate a unique high-entropy value for each environment |
| `PAYSTACK_SECRET_KEY` | Required for real payment initialization | Server-side Paystack API access | Use `sk_test_` outside production; do not share in chat or source control |
| `PAYSTACK_PUBLIC_KEY` | Required for client payment flow when enabled | Matching Paystack public key | Use matching `pk_test_` outside production |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical public origin for the active environment | No trailing slash |
| `NEXT_PUBLIC_API_URL` | Yes | Public API origin | Typically `<site-url>/api` |
| `SEED_ADMIN_EMAIL` | Required for production seed create | Initial administrator email | Store only in the approved secret manager |
| `SEED_ADMIN_PASSWORD` | Required for production seed create | Initial administrator password | Store only in the approved secret manager |
| `SEED_DEMO_DATA` | Ignored in production | Historical development switch | Production demo data is always blocked |
| `STRUCTURED_LOGGING` | Optional | Enables JSON console bridge outside production | Set to `true` only for controlled troubleshooting |

## Connection patterns

The following are intentionally non-functional patterns, not secrets:

```text
DATABASE_URL=postgresql://<runtime-role>.<project-ref>:<password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://<migration-role>:<password>@db.<project-ref>.supabase.co:5432/postgres
```

Do not use historical Neon examples, generic local `postgresql://localhost` examples, or SQLite file URLs for the deployed application database. The only local PostgreSQL URL supported by repository automation is the guarded `sparkle247_test` connection documented in [LOCAL_INTEGRATION_TESTING.md](./LOCAL_INTEGRATION_TESTING.md).
