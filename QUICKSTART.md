# 247 Sparkle — Quick Start Guide

**Last Updated**: June 2026

---

## 🚀 Get Running in 5 Minutes

```bash
# 1. Install dependencies
npm install

# 2. Initialize SQLite database and push schema
npm run db:push

# 3. Seed default admin + pricing data
npm run db:seed

# 4. Start dev server
npm run dev
```

Visit: **http://localhost:4028**

---

## 🔑 Default Credentials

| Role | Email | Password | Login URL |
|------|-------|----------|-----------|
| Admin | admin@247sparkle.com | admin123 | `/admin/login` |

---

## 🗄️ Database

- **Dev**: SQLite — file at `prisma/dev.db` (created automatically by `db:push`)
- **Production**: Change `schema.prisma` provider to `postgresql` and update `DATABASE_URL`

See `DATABASE_SETUP.md` for full details.

---

## 📚 API Reference

### Authentication
```
POST /api/auth/customer/signup
POST /api/auth/customer/login
POST /api/auth/rider/signup
POST /api/auth/rider/login
POST /api/auth/partner/signup
POST /api/auth/partner/login
POST /api/auth/admin/login
```

### Orders
```
POST /api/orders                    # Create order (customer, auth required)
GET  /api/orders                    # Customer's own orders
GET  /api/orders/[id]               # Single order detail
POST /api/orders/[id]/status        # Update order status (rider/admin)
```

### Rider Jobs
```
GET  /api/riders/jobs               # Available jobs (rider auth)
POST /api/riders/jobs/[id]/accept   # Accept a job
POST /api/riders/location           # Update GPS location
GET  /api/riders/location           # Get current location
```

### Rider Profile
```
GET/PUT  /api/rider/profile
GET/POST /api/rider/withdrawals
GET      /api/rider/earnings
PUT      /api/rider/availability
PUT      /api/rider/password
```

### Customer Profile
```
GET/PUT  /api/customer/profile
GET/POST /api/customer/addresses
PUT      /api/customer/password
```

### Partner Profile
```
GET/PUT /api/partner/profile
PUT     /api/partner/password
```

### Admin
```
GET /api/admin/riders
PUT /api/admin/riders/[id]          # body: { "action": "APPROVE" | "REJECT" | "SUSPEND" }
GET /api/admin/partners
PUT /api/admin/partners/[id]        # body: { "action": "APPROVE" | "REJECT" | "SUSPEND" }
GET /api/admin/orders
```

### Pricing & Certificates
```
GET /api/pricing                    # Public — all pricing
PUT /api/pricing                    # Admin only — update pricing
GET /api/certificates/verify/[number]   # Public — verify fumigation cert
GET /api/certificates/customer/[userId] # Customer's own certificates
```

### Quotations
```
POST /api/quotations                # Public — submit quotation request
GET  /api/quotations                # Admin only — list all quotations
PUT  /api/quotations/[id]           # Admin only — update status
```

### Payments
```
POST /api/payment/verify/[reference] # Verify Paystack payment for the signed-in customer/admin
```

---

## 🛠️ Common Commands

```bash
npm run dev              # Start dev server (port 4028)
npm run build            # Production build
npm run serve            # Run production build

npm run db:push          # Push Prisma schema to DB
npm run db:seed          # Seed default data
npm run prisma:generate  # Regenerate Prisma client

npm run type-check       # TypeScript check
npm run lint             # ESLint
npm run lint:fix         # Auto-fix lint issues
npm run format           # Prettier format
```

---

## 🔍 Verify Certificate (Test)

Open `http://localhost:4028/verify` and test with:
- `SPKFUM-2026-00001` (valid — seeded)
- `SPKFUM-2026-00002` (valid — seeded)
- Any other value → invalid

> Note: These certificates only exist after running `npm run db:seed`.

---

## 📋 Known Issues

See `MVP_STATUS.md` for the full list. Key items:

- No logout endpoint yet (`POST /api/auth/logout` missing) — ✅ Now added
- Admin approval uses `PUT` (not `POST` as some older docs state)
- Commission rate confirmed at 20%
- `/admin/finance` and `/admin/dashboard` KPIs use static/mock data (no stats API yet)

---

## 📖 Other Docs

| File | Purpose |
|------|---------|
| `MVP_STATUS.md` | Full feature status & known issues |
| `DATABASE_SETUP.md` | DB setup, commands, SQLite → PostgreSQL migration |
| `TESTING.md` | Manual testing walkthrough |
| `SETUP.md` | Full environment setup guide |
| `MVP_BUILD_SUMMARY.md` | Original build summary (may have minor inaccuracies) |
