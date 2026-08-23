# 247Sparkle Testing Guide

## Test layers

247Sparkle uses complementary test layers rather than relying on a single coverage percentage.

| Layer | Command | Database requirement | Focus |
| --- | --- | --- | --- |
| Unit and regression | `npm test` | None | Validation, money handling, order state rules, authentication helpers, middleware, health endpoints, structured-log redaction, and UI regression assertions |
| Local database integration | `npm run test:integration` | Guarded local `sparkle247_test` PostgreSQL database | Real persistence for order pricing, payment-event idempotency, session login, rider claims, order transitions, and readiness checks |
| Manual browser validation | `npm run dev` | Isolated development/test database for dynamic flows | Signup, login, booking, rider/admin workflow, public pages, and accessibility review |
| Provider validation | Owner-approved Paystack test mode | Isolated Supabase test environment and `sk_test_` / `pk_test_` pair | Checkout, verification, signed webhook, replay, and failure behavior |

## Fast automated checks

Run the following before requesting a review or creating a release commit:

```bash
npm test
npm run type-check
npm run lint
npm run build
```

The production build currently emits known `jose` Edge-runtime warnings related to compression APIs. Record any change to that warning profile; do not suppress it blindly.

## Local PostgreSQL integration suite

The integration suite only runs through the guarded script below. It refuses non-local hosts and database names other than `sparkle247_test`.

```bash
npm run test:integration:reset
npm run test:integration
```

Follow [LOCAL_INTEGRATION_TESTING.md](./LOCAL_INTEGRATION_TESTING.md) for first-time local PostgreSQL setup. Do not point this suite at Supabase production, any customer database, or a live Paystack account.

## Manual browser smoke test

Start the application with `npm run dev` and open [http://localhost:4028](http://localhost:4028).

| Workflow | Expected behavior |
| --- | --- |
| Public pages | Homepage, services, contact, partner onboarding, certificate verification, and `/api/health` are reachable without an account. |
| Customer signup and login | Empty fields show field-level errors; credentials are submitted with protected POST requests; a valid login creates an HttpOnly session. |
| Rider and partner onboarding | Required-field feedback appears, submissions use POST, and unapproved riders cannot claim work. |
| Customer order | The server derives price from the Pricing table; unknown laundry items and zero-priced cleaning orders are rejected. |
| Rider fulfilment | One approved, working rider can claim a paid unassigned order; unauthorized or duplicate claims are rejected. |
| Order status | Only the assigned rider or an administrator can make valid paid-order transitions. |
| Operations | `/api/health` returns `200`; `/api/readiness` returns `200` only when its database dependency is configured and reachable. |

## Paystack test-mode checklist

Paystack validation is intentionally deferred until the owner supplies test-only credentials through the approved secret channel. When available, validate all items below in a Supabase **test** environment:

1. Initialize a checkout with the expected kobo amount and metadata.
2. Verify a successful transaction only for the signed-in customer or administrator.
3. Send a valid signed `charge.success` webhook and confirm exactly one payment event, paid transition, and audit entry.
4. Replay the same signed webhook and confirm idempotent behavior.
5. Reject invalid signatures, failed status, amount mismatch, currency mismatch, and unknown references.

No live keys, live card details, business identity forms, or live payment attempts are required for this checklist.

## Failure reporting

When a test fails, capture the command, commit hash, route or workflow, safe reproduction steps, and the timestamped structured error event. Do not copy cookies, tokens, database URLs, Paystack keys, customer addresses, phone numbers, or passwords into tickets or logs.
