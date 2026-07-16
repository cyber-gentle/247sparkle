# 247 Sparkle MVP - Setup Guide

## Project Overview

This is the MVP (Minimum Viable Product) for 247 Sparkle, an on-demand laundry and cleaning services platform. The platform includes:

- **Customer Portal**: Place orders, track deliveries, download fumigation certificates
- **Rider Portal**: Accept delivery jobs, earn commissions
- **Partner Portal**: Manage laundry business operations
- **Admin Panel**: Manage users, orders, pricing, and approvals

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Payments**: Paystack (Nigerian payment gateway)
- **ORM**: Prisma

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Paystack account (for payment processing)
- Google Maps API key (optional, for maps features)

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your actual keys:

```bash
cp .env.example .env.local
```

**Required Variables:**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sparkle247"

# JWT
JWT_SECRET="your-secret-key-here"

# Paystack (Get from https://dashboard.paystack.com)
PAYSTACK_SECRET_KEY="sk_test_xxx"
PAYSTACK_PUBLIC_KEY="pk_test_xxx"

# Google Maps (optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_key_here"

# API URLs
NEXT_PUBLIC_API_URL="http://localhost:4028"
NODE_ENV="development"
```

### 3. Create PostgreSQL Database

```bash
# Create database
createdb sparkle247

# Or using psql
psql -U postgres -c "CREATE DATABASE sparkle247;"
```

### 4. Initialize Prisma

Generate Prisma client and set up the database schema:

```bash
npm run prisma:generate
npm run db:push
```

### 5. Seed Database with Default Data

Populate the database with default admin user and pricing:

```bash
npm run db:seed
```

**Default Admin Credentials:**
- Email: `admin@247sparkle.com`
- Password: `admin123`

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at: **http://localhost:4028**

### Build for Production

```bash
npm run build
npm run serve
```

## API Endpoints

### Authentication

- **Customer**: `POST /api/auth/customer/signup` | `POST /api/auth/customer/login`
- **Rider**: `POST /api/auth/rider/signup` | `POST /api/auth/rider/login`
- **Partner**: `POST /api/auth/partner/signup` | `POST /api/auth/partner/login`
- **Admin**: `POST /api/auth/admin/login`

### Orders

- `POST /api/orders` - Create order (customer)
- `GET /api/orders` - Get customer orders
- `GET /api/admin/orders` - Get all orders (admin)

### Payments

- `POST /api/payment/verify/:reference` - Verify Paystack payment for the signed-in customer/admin

### Pricing

- `GET /api/pricing` - Get all pricing
- `PUT /api/pricing` - Update pricing (admin only)

### Admin Management

- `GET /api/admin/riders` - Get all riders
- `PUT /api/admin/riders/:id` - Approve/reject/suspend rider
- `GET /api/admin/partners` - Get all partners
- `PUT /api/admin/partners/:id` - Approve/reject/suspend partner

## User Flows

### 1. Customer Places Laundry Order

1. Customer signs up at `/customer/signup`
2. Navigates to `/customer/new-order`
3. Selects laundry items with quantities
4. Chooses pickup option (home/partner)
5. Reviews order summary
6. Pays via Paystack
7. Receives confirmation
8. Tracks order at `/customer/orders/:id`

### 2. Rider Gets Approved & Receives Jobs

1. Rider signs up at `/rider/signup`
2. Admin approves at `/admin/riders`
3. Rider can now log in
4. Rider's availability status in dashboard
5. Admin auto-assigns nearby laundry orders
6. Rider accepts and completes jobs
7. Rider earns 20% commission per delivery

### 3. Admin Manages Platform

1. Admin logs in at `/admin/login`
2. Dashboard shows live stats: orders, riders, partners, revenue
3. Approve pending rider & partner applications
4. Manage orders and payment status
5. Update pricing for laundry items
6. View commissions and financial reports

## Database Schema

The Prisma schema includes models for:

- **Users**: Customer, Rider, Partner, Admin
- **Orders**: Laundry, Home Cleaning, Office Cleaning, Fumigation
- **Pricing**: Dynamic pricing for all services
- **Riders**: With location tracking and commission tracking
- **Partners**: Laundry businesses with workload management
- **Certificates**: Fumigation certificates
- **Quotations**: For on-site services requiring quotes

## Key Business Rules

1. **Fumigation = On-site only** - No pickup/delivery
2. **Rider commission = 20%** of delivery fee per laundry order
3. **White clothes = Separate category** to prevent mixing
4. **Rider/Partner approval required** before they can log in
5. **Payment must succeed** before order is confirmed
6. **Certificate issued** after fumigation completion

## Development Commands

```bash
# Install packages
npm install

# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run db:push

# Seed database
npm run db:seed

# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format
```

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

- Ensure PostgreSQL is running
- Check DATABASE_URL is correct
- Verify database exists

### Prisma Generate Error

```bash
npx prisma generate
```

### API Routes Not Found

- Restart the dev server: `Ctrl+C` and `npm run dev`
- Clear Next.js cache: `rm -rf .next`

## Next Steps for Full Production

1. **Real-time Updates**: Implement Socket.io for live order tracking
2. **File Uploads**: Integrate Cloudinary for photo uploads
3. **Maps**: Integrate Google Maps for rider tracking
4. **Certificate PDF**: Generate fumigation certificates as PDFs
5. **Email Notifications**: Send order confirmations and updates
6. **SMS Notifications**: Send updates to riders and customers
7. **Testing**: Write unit and integration tests
8. **Deployment**: Deploy to Vercel or AWS

## Support

For issues or questions, please contact:
- **Email**: info.247sparkle@gmail.com
- **Phone**: 09039661885
- **WhatsApp**: 07052258764

---

**Version**: 1.0 MVP
**Last Updated**: May 31, 2026
