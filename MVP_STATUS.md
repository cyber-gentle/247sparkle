# 247Sparkle MVP — Implementation Status

**Last Updated**: September 2026
**Overall Status**: Pre-production release candidate

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

### API Routes (56 endpoints)

#### Auth — `/api/auth/` (9 routes)

- `POST /api/auth/customer/signup`
- `POST /api/auth/customer/login`
- `POST /api/auth/rider/signup`
- `POST /api/auth/rider/login`
- `POST /api/auth/partner/signup`
- `POST /api/auth/partner/login`
- `POST /api/auth/admin/login`
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
- `/customer-dashboard` — Public dashboard landing

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
- Zod input validation on all API routes
- Middleware injects `x-user-id`, `x-user-email`, `x-user-role` headers
- Server-only RLS on all Supabase tables
- Image upload with magic-byte validation and file-type enforcement
- Rate limiting on sensitive endpoints
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

### Test Coverage (38 test files)

#### Unit Tests (33 files)

| Group | Count | Examples |
| --- | --- | --- |
| Route/page tests (`tests/app/`) | 18 | admin-order-assign, paystack-webhook, rider-jobs, upload, certificates |
| Library tests (`tests/lib/`) | 11 | money, order-integrity, order-state, auth, rate-limit, logger, order-notifications |
| Component tests (`tests/components/`) | 3 | app-logo, contact-section, provider-application-shell |
| Prisma tests (`tests/prisma/`) | 1 | seed-policy |

#### Integration Tests (5 files)

| Test | Behavior exercised |
| --- | --- |
| `fulfilment-routes` | Rider approval gate, atomic single claim, duplicate claim conflict, status transitions |
| `operations` | Health/readiness probes against real PostgreSQL |
| `order-integrity` | Server-side pricing, kobo-safe totals, payment-event idempotency |
| `order-routes` | Session enforcement, price lookup, payment reference persistence |
| `session-and-middleware` | Bcrypt login, HttpOnly cookie, token verification, role matrix |

---

## ⚠️ Known Issues / Gaps

### Real-Time Updates

- No Socket.io server. Customer order tracking and rider job pages poll the
  existing REST APIs every 10s, which keeps the app deployable on Netlify
  without a socket server. Socket.io remains a post-MVP enhancement.

### Maps Integration

- `AddressAutocomplete` (Google Places, gated on `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`,
  with an Otukpo-landmarks offline fallback) and `LocationMap` (rider tracking)
  components are implemented. A live API key has not yet been supplied or
  billing-validated.

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

### Mobile App

- React Native clients are pending (future phase).

---

## 🔜 Next Steps (Priority Order)

All remaining items are **external-credential or infrastructure gates**, not code
work. The application itself is feature-complete for MVP.

1. **Paystack test-mode validation** — owner supplies `sk_test_` / `pk_test_` credentials for checkout, verification, webhook, and failure-path testing
2. **Resend sender verification** — verify the `247sparkle.com` domain so password-reset and order-status emails deliver reliably
3. **Supabase test-environment rehearsal** — hosted cloud rehearsal with isolated test project
4. **Backup and restore validation** — Supabase backup/restore procedure tested with non-production restore target
5. **Google Maps key activation** — enable Places/Maps with billing for full autocomplete and live tracking
6. **Dependency audit** — production dependency audit on a separately tested upgrade branch
7. **Rate limiting hardening** — review and tune rate limits across all auth and payment endpoints
8. **SMS notifications** — Twilio for urgent order alerts (post-MVP)
9. **Socket.io integration** — real-time order/job updates to replace polling (post-MVP)

---

## 🗄️ Database

- **Provider**: Supabase PostgreSQL (server-only RLS enabled)
- **Runtime**: Transaction pooler on port `6543` with `pgbouncer=true`
- **Migrations**: Direct connection on port `5432` via `DIRECT_URL`
- **Local integration**: Guarded `sparkle247_test` PostgreSQL database
- **Seed data**: Admin user + default pricing (demo data blocked in production)

### Default Credentials (after seed)

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@247sparkle.com | Set via `SEED_ADMIN_PASSWORD` (or printed once by the seed) |

---

## 📊 Metrics

| Category | Count |
| --- | --- |
| API Route Files | 56 |
| Database Models | 16 |
| Frontend Pages | 39 |
| Test Files | 38 (33 unit + 5 integration) |
| Unit Tests (assertions) | 159 passing |
| Auth Routes | 9 (+ logout) |
| Admin Routes | 11 |
| Operations Probes | 2 |

---

## 📖 Related Documentation

| File | Purpose |
| --- | --- |
| `README.md` | Project overview, quick start, environment setup, release gates |
| `DATABASE_SETUP.md` | Database connection model, migration procedure, seed policy |
| `SUPABASE_SETUP.md` | Supabase-specific setup, RLS posture, financial test gate |
| `ENVIRONMENT_REFERENCE.md` | Environment variable names and purpose reference |
| `LOCAL_INTEGRATION_TESTING.md` | Local PostgreSQL integration test setup and commands |
| `TESTING.md` | Test layers, commands, manual smoke test matrix, Paystack checklist |
| `OPERATIONS_RUNBOOK.md` | Health probes, structured logging, alert procedures, backup gate |
| `SETUP.md` | Full development-to-production handoff guide |
| `prompt.md` | Original developer brief and requirements specification |
