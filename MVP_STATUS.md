# 247Sparkle MVP — Implementation Status

**Last Updated**: 2026-09-13 (post-audit revision)
**Overall Status**: Near-complete — all five quality gates pass on the current
commit (`format:check`, `lint`, `type-check`, `test`, `build`; 190/190 unit
tests green), but a 2026-09-13 audit found code-level launch blockers that
must be fixed before publish — see [Known Issues](#️-known-issues--gaps) and
[Remaining Work](#-remaining-work). Beyond those fixes, remaining work is
owner-supplied credentials and infrastructure rehearsals, not feature
development.

---

## ✅ Completed

### Database & ORM

- Prisma schema with **16 models** on **Supabase PostgreSQL**
- Server-only Row Level Security (RLS) on all application tables
- Committed migration history with safe `migrate deploy` workflow
- Seed script with environment-aware safety (blocks demo data in production)
- String-based enums with convention constraints (no Prisma `enum` keyword)

**Models (16):**

```
User, PasswordResetToken, Customer, SavedAddress, Rider, Partner,
Order, OrderItem, Pricing, Commission, WithdrawalRequest,
Certificate, Quotation, AuditLog, PaymentEvent, RateLimitBucket
```

### Authentication System

- JWT token generation and verification (`src/lib/auth.ts`)
- Password hashing with bcryptjs
- Auth middleware with role-based header injection (`src/middleware.ts`)
- Customer, Rider, Partner, Admin signup/login API routes
- Logout endpoint (`POST /api/auth/logout`) — clears `auth_token` cookie
- Password reset flow: `POST /api/auth/forgot-password` + `POST /api/auth/reset-password`
  (single-use SHA-256-hashed tokens, 30-minute expiry, atomic consumption,
  no user-enumeration; email delivered via Resend when `RESEND_API_KEY` is set)
- Public `/forgot-password` and `/reset-password` pages; "Forgot password?"
  link on all four portal login pages
- HTTP-only cookies with 7-day expiry
- Role-based access control (CUSTOMER, RIDER, PARTNER, ADMIN)
- Admin TOTP two-factor authentication (`/api/auth/admin/2fa`): first-login
  QR enrollment, verify stage, lockout accounting, audit logging, rate
  limited. No session cookie is issued until 2FA passes.

### API Routes (57 endpoints)

#### Auth — `/api/auth/` (10 routes)

- `POST /api/auth/customer/signup`
- `POST /api/auth/customer/login`
- `POST /api/auth/rider/signup`
- `POST /api/auth/rider/login`
- `POST /api/auth/partner/signup`
- `POST /api/auth/partner/login`
- `POST /api/auth/admin/login` — issues pending 2FA tokens when enrolled
- `POST /api/auth/admin/2fa` — TOTP enrollment/verify for admin login
- `POST /api/auth/forgot-password` — cross-role reset link email
- `POST /api/auth/reset-password` — consume token, set new password

#### Orders — `/api/orders/` (3 routes)

- `POST /api/orders` — create order with server-side price lookup
- `GET /api/orders` — customer's own orders
- `GET /api/orders/[id]` — single order detail (role-gated)
- `POST /api/orders/[id]/status` — update order status

#### Riders — `/api/riders/` (3 routes)

- `GET /api/riders/jobs` — available jobs for rider
- `POST /api/riders/jobs/[id]/accept` — accept a job (atomic single claim)
- `POST /api/riders/location` — update/get rider GPS location

#### Rider Profile — `/api/rider/` (5 routes)

- `GET/PUT /api/rider/profile`
- `GET/POST /api/rider/withdrawals`
- `GET /api/rider/earnings`
- `PUT /api/rider/availability`
- `PUT /api/rider/password`

#### Customer Profile — `/api/customer/` (4 routes)

- `GET/PUT /api/customer/profile`
- `GET/POST /api/customer/addresses`
- `DELETE /api/customer/addresses/[id]`
- `PUT /api/customer/password`

#### Partner — `/api/partner/` (4 routes)

- `GET/PUT /api/partner/profile`
- `PUT /api/partner/password`
- `GET /api/partner/orders` — orders assigned to the partner
- `POST /api/partner/orders/[id]/ready` — mark order ready for pickup

#### Admin — `/api/admin/` (11 routes)

- `GET /api/admin/riders` — list all riders
- `PUT /api/admin/riders/[id]` — approve/reject/suspend rider
- `GET /api/admin/partners` — list partners
- `PUT /api/admin/partners/[id]` — approve/reject/suspend partner
- `GET /api/admin/orders` — admin order view with all details
- `PUT /api/admin/orders/[id]/assign` — assign rider to order
- `PUT /api/admin/orders/[id]/assign-partner` — route order to partner
- `GET /api/admin/customers` — aggregated customer list
- `GET /api/admin/stats` — dashboard KPI stats
- `GET /api/admin/withdrawals` — list withdrawal requests
- `PUT /api/admin/withdrawals/[id]` — process withdrawal (approve/reject/mark paid)

#### Payment — `/api/payment/` (2 routes)

- `POST /api/payment/verify/[reference]` — Paystack payment verification
- `POST /api/payment/webhook` — Paystack signed webhook handler

#### Certificates — `/api/certificates/` (5 routes)

- `POST /api/certificates` — admin issue certificate
- `GET /api/certificates/[id]/download` — download certificate PDF
- `GET /api/certificates/customer` — customer's own certificates
- `GET /api/certificates/customer/[userId]` — certificates by user ID
- `GET /api/certificates/verify/[number]` — public certificate lookup

#### Other (10 routes)

- `GET /api/pricing` — public pricing list
- `PUT /api/pricing` — admin update pricing
- `POST /api/quotations` — public quotation request
- `GET /api/quotations` — admin list quotations
- `PUT /api/quotations/[id]` — admin update quotation status
- `GET /api/banks` — Paystack bank list proxy
- `GET /api/banks/resolve` — Paystack account resolve proxy
- `POST /api/contact` — public contact form
- `POST /api/upload` — secure image upload with magic-byte validation
- `POST /api/auth/logout` — clear session

#### Operations (2 routes)

- `GET /api/health` — liveness probe (no database dependency)
- `GET /api/readiness` — readiness probe (database check)

### Frontend Pages (39 pages)

#### Public (10)

- `/` — Root landing
- `/homepage` — Full homepage with hero, services, testimonials
- `/services` — Services listing with pricing
- `/how-it-works` — How it works guide
- `/contact` — Contact & quotation form
- `/become-a-partner` — Partner/rider application
- `/verify` — Public certificate verification
- `/forgot-password` — Cross-portal password reset request
- `/reset-password` — Set new password from emailed token
- `/customer-dashboard` — Implementation host for the customer dashboard
  (the `/customer/dashboard` route re-exports it and supplies the shared
  portal components). Orphan route — nothing links to it, and it is
  currently **not covered by the middleware auth matcher** (see
  [Known Issues](#️-known-issues--gaps))

#### Customer Portal (8)

- `/customer/signup`, `/customer/login`
- `/customer/dashboard` — summary cards, recent orders, quick actions
- `/customer/new-order` — multi-step order form (6 steps)
- `/customer/orders` — order history with filters
- `/customer/orders/[id]` — order detail with status timeline
- `/customer/certificates` — fumigation certificates
- `/customer/profile` — edit profile, saved addresses, change password

#### Rider Portal (6)

- `/rider/signup`, `/rider/login`
- `/rider/dashboard` — available jobs, availability toggle, earnings summary
- `/rider/job/[id]` — active job with status progression buttons
- `/rider/earnings` — commission breakdown, wallet balance, withdrawal request
- `/rider/profile` — edit profile, bank details

#### Partner Portal (4)

- `/partner/signup`, `/partner/login`
- `/partner/dashboard` — workload toggle, incoming orders, revenue summary
- `/partner/profile` — edit business details, operating hours, bank details

#### Admin Portal (10)

- `/admin/login`
- `/admin/dashboard` — live stat cards, alerts panel
- `/admin/orders` — full order table with assign rider/partner, status management
- `/admin/riders` — rider management with approval, withdrawal processing
- `/admin/partners` — partner management with approval
- `/admin/customers` — customer list with order history
- `/admin/finance` — revenue, commissions, transactions
- `/admin/pricing` — edit laundry and fumigation pricing
- `/admin/quotations` — quotation request management
- `/admin/certificates` — issue and manage fumigation certificates

#### Admin Dashboard (1)

- `/admin-dashboard` — analytics with revenue chart, service breakdown chart

### Security

- JWT HTTP-only cookies (7-day expiry)
- Role-based access control (CUSTOMER, RIDER, PARTNER, ADMIN)
- Zod input validation on API routes (exception: `POST /api/quotations` —
  manual coercion, see Known Issues)
- Middleware injects `x-user-id`, `x-user-email`, `x-user-role` headers
- Server-only RLS on all Supabase tables
- Image upload with magic-byte validation and file-type enforcement
- Rate limiting on sensitive endpoints (exception: `POST /api/quotations`,
  see Known Issues)
- Structured logging with PII/secret redaction
- Spoofed identity header removal in middleware

### Financial Integrity

- Server-side price lookup (clients cannot set prices)
- Kobo-safe integer arithmetic for all monetary values
- Paystack webhook signature verification
- Idempotent payment event processing (concurrent duplicate settlement → one event)
- Atomic rider job claim (prevents double-assignment)
- Commission rate standardized at 20%
- Withdrawal approval workflow with wallet balance guards

### Operations

- Liveness probe (`/api/health`) and readiness probe (`/api/readiness`)
- Structured JSON logging in production (via instrumentation)
- PII and secret redaction in all log output
- `Cache-Control: no-store` on probe responses
- Netlify deployment configuration (`netlify.toml` with `@netlify/plugin-nextjs`)
- `postinstall` runs `prisma generate`, so a fresh clone type-checks and tests cleanly

### Notifications

- Transactional email via Resend (`src/lib/email.ts`), optional by design — the
  platform stays fully functional when no provider key is set
- Password-reset emails with single-use, time-limited links
- Customer order-status emails (`src/lib/order-notifications.ts`) on rider
  assignment, pickup, cleaning, scheduling, in-progress, out-for-delivery, and
  completion, each deep-linking to the customer's order page
- Best-effort delivery: notification failures are logged, never surfaced as
  request errors, and never roll back a committed order transition

### Test Coverage (42 test files)

#### Unit Tests (37 files)

| Group                                 | Count | Examples                                                                                                                |
| ------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------- |
| Route/page tests (`tests/app/`)       | 19    | admin-order-assign, admin-login-2fa-safeguards, paystack-webhook, rider-jobs, upload, certificates                      |
| Library tests (`tests/lib/`)          | 13    | money, order-integrity, order-state, auth, auth-pending-two-factor, two-factor, rate-limit, logger, order-notifications |
| Component tests (`tests/components/`) | 4     | app-logo, contact-section, password-field, provider-application-shell                                                   |
| Prisma tests (`tests/prisma/`)        | 1     | seed-policy                                                                                                             |

#### Integration Tests (5 files)

| Test                     | Behavior exercised                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `fulfilment-routes`      | Rider approval gate, atomic single claim, duplicate claim conflict, status transitions |
| `operations`             | Health/readiness probes against real PostgreSQL                                        |
| `order-integrity`        | Server-side pricing, kobo-safe totals, payment-event idempotency                       |
| `order-routes`           | Session enforcement, price lookup, payment reference persistence                       |
| `session-and-middleware` | Bcrypt login, HttpOnly cookie, token verification, role matrix                         |

---

## ⚠️ Known Issues / Gaps

### 🔴 Payment return path not closed (launch blocker)

Found in the 2026-09-13 audit:

- **No `callback_url` is sent to Paystack** on transaction initialization
  (`src/lib/paystack.ts`). After paying, the customer lands on Paystack's
  default end page with no route back to the app. `NEXT_PUBLIC_SITE_URL` is
  documented as the Paystack callback origin but is never used by the
  payment code.
- **`/api/payment/verify/[reference]` has zero client callers.** Payment
  confirmation currently depends entirely on the webhook (which is solid:
  HMAC-SHA512, timing-safe compare, amount/currency re-validation).
- **"Retry payment" is a dead end.** When Paystack initialization fails,
  `POST /api/orders` returns 202 telling the customer to "retry payment
  from the order page", but the `paymentUrl` is discarded, no retry
  endpoint exists, and the order detail page has no pay button. Such
  orders are permanently unpayable.

Fix: send `callback_url` (from `NEXT_PUBLIC_SITE_URL`), add a payment
confirmation page/step that calls the verify endpoint, and add a
retry-payment endpoint plus a pay button on the order detail page.

### 🔴 `/customer-dashboard` not auth-gated (launch blocker)

`src/middleware.ts` protects `/admin-dashboard` in `protectedPagePaths`,
but the `/customer/` prefix matcher does not match `/customer-dashboard`.
The full customer dashboard page (the implementation host that
`/customer/dashboard` re-exports) is publicly reachable without a session.
Fix the matcher, or remove the orphan route.

### 🔴 Placeholder homepage content (launch blocker)

`src/app/homepage/components/TestimonialsSection.tsx` ships fabricated
5-star reviews ("Placeholder reviews per the brief"), one of which
advertises map tracking — a feature that was removed. Replace with real
quotes or remove the section before launch.

### Quotations endpoint gaps

`POST /api/quotations` is public but has **no rate limiting and no Zod
validation** (manual `String()` coercion), unlike the equivalent contact
form. The public `GET`/`PUT` admin handlers authorize off the
`x-user-role` header directly rather than `requireRole` (safe only because
middleware strips spoofed headers, but inconsistent with every other
route). This contradicts the earlier "Zod on all API routes" claim.

### Cloudinary simulated-upload fallback

When `CLOUDINARY_*` credentials are absent, `src/lib/cloudinary.ts`
silently returns a base64 data URI with `simulated: true`. Multi-MB data
URIs then get stored in the database via signup. Production should fail
loudly instead of degrading silently.

### Certificate PDF on Netlify serverless (unverified)

`src/lib/certificate-pdf.ts` is buffer-only (no filesystem writes), but
pdfkit loads built-in Helvetica `.afm` font data from disk at runtime and
`next.config.mjs` has no `serverExternalPackages: ['pdfkit']` entry.
Whether the Netlify function bundle includes the font files is unproven —
no production deploy has been validated.

### Real-Time Updates

- No Socket.io server. Customer order tracking and rider job pages poll the
  existing REST APIs every 10s, which keeps the app deployable on Netlify
  without a socket server. Socket.io remains a post-MVP enhancement.

### Maps Integration

- Removed (2026-09-13). Google Places autocomplete, embedded `LocationMap`
  iframes, and "Open in Google Maps" links were all stripped to avoid Maps
  API usage charges. `AddressAutocomplete` remains as a plain textarea with
  Otukpo landmark quick-select chips.

### Payment Provider Validation

- Paystack integration is code-complete (init, verify, signed webhook, idempotency).
- Real test-mode validation is **paused** until the owner supplies test-only credentials through the approved secret channel.

### Email Delivery

- Resend integration is code-complete (`src/lib/email.ts`, active when
  `RESEND_API_KEY` is set) and powers password-reset and order-status emails.
  A verified sender domain has not yet been supplied, so delivery is unvalidated.
- Order-status email notifications are implemented (`src/lib/order-notifications.ts`)
  and fire on rider assignment and every customer-facing status transition.
  Delivery is best-effort: a notification failure never rolls back a committed
  order transition.
- SMS notifications (Twilio) are not implemented.

### Code Quality Debt

Lint passes with **0 errors**, but **114 warnings** remain. These are
pre-existing, non-blocking, and tracked rather than suppressed:

| Rule                                 | Count | Nature                                                                        |
| ------------------------------------ | ----- | ----------------------------------------------------------------------------- |
| `@typescript-eslint/no-explicit-any` | 76    | Mostly `catch (error: any)` blocks and third-party payload shapes             |
| `@typescript-eslint/no-unused-vars`  | 26    | Unused imports and unused caught-error bindings                               |
| `react-hooks/exhaustive-deps`        | 10    | Intentionally narrowed effect dependency arrays on fetch-on-mount pages       |
| `jsx-a11y/alt-text`                  | 2     | `AppImage` wrapper forwards `alt` dynamically; the rule cannot see through it |

None affect runtime behavior. Clearing them is a mechanical follow-up best done
on its own branch so the diff stays reviewable.

### Unverified Locally

- **Integration suite** (`npm run test:integration`, 5 files) has **not** been
  run in the current environment because it requires a local PostgreSQL
  `sparkle247_test` database that is not provisioned here. The suite is
  committed and CI-ready; see `LOCAL_INTEGRATION_TESTING.md` for one-time setup.
- **Production build warnings**: the build emits known `jose` Edge-runtime
  warnings about compression APIs. Expected; record any change to that profile.

### Mobile App

- React Native clients are pending (future phase).

---

## 🔜 Remaining Work

The application needs **no new features**, but the 2026-09-13 audit found
code-level blockers (section 0) that must land before launch. The rest
splits into owner-supplied credentials, infrastructure rehearsals, and
optional cleanup.

### 0. Code fixes (blocking launch — from the 2026-09-13 audit)

| #   | Item                                                                                                                                                                    | Files                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 0.1 | **Close the payment loop**: send `callback_url` to Paystack, add a payment-confirmation step that calls `/api/payment/verify/[reference]`, and persist the `paymentUrl` | `src/lib/paystack.ts`, `src/app/api/orders/route.ts`, customer order pages |
| 0.2 | **Retry payment**: add a retry-payment endpoint and a pay button on the order detail page                                                                               | new route + `src/app/customer/orders/[id]/page.tsx`                        |
| 0.3 | **Auth-gate `/customer-dashboard`** (or remove the orphan route)                                                                                                        | `src/middleware.ts`                                                        |
| 0.4 | **Quotations hardening**: Zod validation + rate limiting on `POST /api/quotations`; use `requireRole` on the admin handlers                                             | `src/app/api/quotations/route.ts`                                          |
| 0.5 | **Replace placeholder testimonials** with real quotes or remove the section                                                                                             | `src/app/homepage/components/TestimonialsSection.tsx`                      |
| 0.6 | **Fail loudly on missing Cloudinary credentials in production** instead of the simulated data-URI fallback                                                              | `src/lib/cloudinary.ts`                                                    |
| 0.7 | **Remove junk committed at repo root** (`iron/iron.mp4`, `iron/*.txt` — duplicates of `public/iron/`)                                                                   | repo root                                                                  |

### A. Owner-supplied credentials (blocking launch)

Each item is blocked on a secret only the site owner can provide, delivered
through the approved secret channel. No code changes are required to consume them.

| #   | Item                           | Unblocks                                                                                        | Env var(s)                     |
| --- | ------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------ |
| 1   | **Resend domain verification** | Real delivery of password-reset and order-status emails from a verified `247sparkle.com` sender | `RESEND_API_KEY`, `EMAIL_FROM` |

Paystack test-mode keys were supplied (2026-09-13) and are set in `.env`;
end-to-end checkout, verification, signed-webhook, replay and failure-path
validation per `TESTING.md` are still outstanding. Google Maps integration
was removed entirely (address autocomplete, embedded maps, and tracking
links) to avoid Maps API usage charges — addresses are entered as free text
with Otukpo landmark quick-select chips.

### B. Infrastructure rehearsals (blocking launch)

| #   | Item                                    | Completion condition                                                                                                                              |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4   | **Supabase test-environment rehearsal** | Isolated cloud project with least-privilege Prisma role, migrations applied, RLS posture and pooled/direct connections verified                   |
| 5   | **Backup and restore validation**       | A restore rehearsal has actually **succeeded** into a non-production target, with a documented restore owner, retention decision and test cadence |
| 6   | **Local integration suite run**         | Provision `sparkle247_test`, then `npm run test:integration:reset && npm run test:integration` passes                                             |
| 7   | **Production monitoring**               | `/api/health` and `/api/readiness` monitored, structured JSON logs visible in the Netlify host                                                    |

### C. Hardening and cleanup (non-blocking)

| #   | Item                     | Notes                                                                           |
| --- | ------------------------ | ------------------------------------------------------------------------------- |
| 8   | **Dependency audit**     | Address production `npm audit` findings on a separately tested upgrade branch   |
| 9   | **Lint warning cleanup** | Clear the 114 tracked warnings above; mechanical, best on its own branch        |
| 10  | **Rate limiting review** | Tune the existing limits across auth and payment endpoints under realistic load |

### D. Post-MVP enhancements (explicitly out of scope)

| #   | Item                             | Notes                                                                                  |
| --- | -------------------------------- | -------------------------------------------------------------------------------------- |
| 11  | **SMS notifications**            | Twilio for urgent order alerts; email already covers the status lifecycle              |
| 12  | **Socket.io real-time**          | Replace the current 10s polling; requires a socket server, which Netlify does not host |
| 13  | **Customer reviews and ratings** | Not in the original MVP brief                                                          |
| 14  | **React Native mobile clients**  | Future phase                                                                           |

### Definition of launch-ready

The platform is ready to publish once **section 0 (audit fixes)**, **A**,
and **B** are complete and the release commit passes all five gates:
`format:check`, `lint`, `type-check`, `test`, and `build`. Section C is
recommended before launch but not blocking; section D is deliberately
deferred.

---

## 🗄️ Database

- **Provider**: Supabase PostgreSQL (server-only RLS enabled)
- **Runtime**: Transaction pooler on port `6543` with `pgbouncer=true`
- **Migrations**: Direct connection on port `5432` via `DIRECT_URL`
- **Local integration**: Guarded `sparkle247_test` PostgreSQL database
- **Seed data**: Admin user + default pricing (demo data blocked in production)

### Default Credentials (after seed)

| Role  | Email                | Password                                                    |
| ----- | -------------------- | ----------------------------------------------------------- |
| Admin | admin@247sparkle.com | Set via `SEED_ADMIN_PASSWORD` (or printed once by the seed) |

---

## 📊 Metrics

| Category                | Count                        |
| ----------------------- | ---------------------------- |
| API Route Files         | 57                           |
| Database Models         | 16                           |
| Frontend Pages          | 39                           |
| Test Files              | 42 (37 unit + 5 integration) |
| Unit Tests (assertions) | 190 passing                  |
| Auth Routes             | 10 (+ logout)                |
| Admin Routes            | 11                           |
| Operations Probes       | 2                            |

---

## 📖 Related Documentation

| File                           | Purpose                                                             |
| ------------------------------ | ------------------------------------------------------------------- |
| `README.md`                    | Project overview, quick start, environment setup, release gates     |
| `DATABASE_SETUP.md`            | Database connection model, migration procedure, seed policy         |
| `SUPABASE_SETUP.md`            | Supabase-specific setup, RLS posture, financial test gate           |
| `ENVIRONMENT_REFERENCE.md`     | Environment variable names and purpose reference                    |
| `LOCAL_INTEGRATION_TESTING.md` | Local PostgreSQL integration test setup and commands                |
| `TESTING.md`                   | Test layers, commands, manual smoke test matrix, Paystack checklist |
| `OPERATIONS_RUNBOOK.md`        | Health probes, structured logging, alert procedures, backup gate    |
| `SETUP.md`                     | Full development-to-production handoff guide                        |
| `prompt.md`                    | Original developer brief and requirements specification             |
