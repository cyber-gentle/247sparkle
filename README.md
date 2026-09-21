# 247Sparkle

247Sparkle is a modern on-demand laundry, dry cleaning, fumigation, and delivery management platform. It offers an end-to-end service ecosystem connecting customers, dispatch riders, laundry hub partners, and administrators.

---

## Features

- **Customer Portal**: Multi-step laundry & dry cleaning booking, fumigation scheduling with instant price quotes, landmark-based address selector, secure Paystack checkout, live order tracking, and downloadable PDF fumigation certificates.
- **Rider Hub**: Real-time delivery dispatch feed, one-click job claiming, GPS route coordination, status updates, and earnings withdrawal management.
- **Partner Portal**: Laundry partner dashboard, order dispatch workflow, workload status management, shop hours configuration, and opt-in Two-Factor Authentication (2FA).
- **Admin Portal**: Executive KPI dashboards, real-time order progression monitoring, customer management, rider & partner approvals, pricing configurations, and audit logging.
- **Security & Integrity**: Role-isolated HttpOnly JWT sessions, TOTP-based Two-Factor Authentication, constant-time webhook signatures, and integer-kobo financial ledgering.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database & ORM**: PostgreSQL with [Prisma](https://www.prisma.io/)
- **Authentication**: Role-based JWT session tokens & TOTP 2FA
- **Payments**: Paystack
- **Media & Documents**: Cloudinary & PDFKit
- **Deployment**: Render

---

## Getting Started

### Prerequisites

- Node.js 22 LTS
- npm 10+
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/cyber-gentle/247sparkle.git
   cd 247sparkle
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy the example environment file and fill in your values:
   ```bash
   cp .env.example .env
   ```
   *(Refer to `.env.example` for all required configuration variables).*

4. Generate Prisma client and initialize database schema:
   ```bash
   npx prisma generate
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:4028](http://localhost:4028) in your browser.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Starts local Next.js development server on port 4028 |
| `npm run build` | Builds the production bundle |
| `npm start` | Runs the production build (binds to dynamic `$PORT` in production) |
| `npm test` | Runs the automated Vitest test suite |
| `npm run type-check` | Performs TypeScript static type checking |
| `npm run lint` | Runs ESLint code quality checks |
| `npm run format:check` | Verifies code formatting with Prettier |
| `npm run format` | Auto-formats code with Prettier |
| `npm run db:push` | Pushes the Prisma schema to the database |
| `npm run db:seed` | Seeds initial pricing and service catalog |

---

## Deployment

The application is configured for deployment on **Render** using the included `render.yaml` blueprint:
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start`
- **Health Check**: `/api/health`

Configure all required production environment variables (database connection strings, JWT secret, Paystack keys, and site URL) securely in the Render dashboard.

---

## License

Private and proprietary. All rights reserved.
