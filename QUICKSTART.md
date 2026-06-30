# 247 Sparkle MVP - Quick Start Guide

## 🎯 What Has Been Built

### Backend Infrastructure (✅ Complete)
- **Prisma ORM** with PostgreSQL schema for all models
- **JWT Authentication** for all 4 user roles (Customer, Rider, Partner, Admin)
- **Paystack Payment Integration** with verification
- **Admin Management APIs** for riders, partners, and orders
- **Order Management System** with status tracking
- **Dynamic Pricing System** for laundry and fumigation services
- **Auth Middleware** to protect routes

### Frontend Structure (✅ Ready for Forms)
- All page layouts and components in place
- Responsive design with Tailwind CSS
- Navigation between portals
- Public website fully styled

### Database (✅ Schema Ready)
- 14 Prisma models defined
- Relationships configured
- Seed script with default data

---

## 🚀 To Get Started Developing

### Step 1: Set Up Local Database
```bash
# Create PostgreSQL database
createdb sparkle247

# Or use psql:
psql -U postgres -c "CREATE DATABASE sparkle247;"
```

### Step 2: Configure Environment
```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local and add:
DATABASE_URL="postgresql://user:password@localhost:5432/sparkle247"
JWT_SECRET="your-secret-key-here"
PAYSTACK_SECRET_KEY="sk_test_xxx"  # From Paystack dashboard
```

### Step 3: Initialize Database
```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run db:push

# Seed with default data
npm run db:seed
```

### Step 4: Start Development
```bash
npm run dev
```

Visit: **http://localhost:4028**

---

## 📚 API Endpoints Available

### Customer Signup/Login
```bash
POST /api/auth/customer/signup
POST /api/auth/customer/login
```

**Request body:**
```json
{
  "email": "customer@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "09012345678"
}
```

### Create Order
```bash
POST /api/orders
Headers: Authorization Bearer <token>
```

**Request body:**
```json
{
  "serviceType": "LAUNDRY",
  "pickupOption": "HOME_PICKUP",
  "pickupAddress": "123 Main Street",
  "deliveryAddress": "123 Main Street",
  "scheduledDate": "2026-06-15",
  "scheduledTime": "10:00",
  "items": [
    {
      "itemName": "T-shirt",
      "quantity": 3,
      "isWhiteGroup": false
    }
  ]
}
```

### Admin Approve Rider
```bash
PUT /api/admin/riders/:id
Headers: Authorization Bearer <admin_token>
```

**Request body:**
```json
{
  "action": "APPROVE"  // or "REJECT", "SUSPEND"
}
```

---

## 🔑 Default Admin Credentials

After running `npm run db:seed`:

```
Email: admin@247sparkle.com
Password: admin123
```

Login at: `/admin/login`

---

## 📂 Key Files to Know

### Backend Logic
- `src/lib/auth.ts` - JWT token handling
- `src/lib/db.ts` - Prisma client setup
- `src/lib/paystack.ts` - Payment integration
- `src/middleware.ts` - Route protection

### API Routes
- `src/app/api/auth/` - Authentication endpoints
- `src/app/api/orders/` - Order management
- `src/app/api/admin/` - Admin endpoints
- `src/app/api/payment/` - Payment verification
- `src/app/api/pricing/` - Pricing management

### Database
- `prisma/schema.prisma` - Data models
- `prisma/seed.ts` - Seed script

### Configuration
- `.env.local` - Environment variables (create this)
- `package.json` - Dependencies and scripts

---

## 🛠️ Common Commands

```bash
# Development
npm run dev                # Start dev server

# Type checking
npm run type-check         # Check TypeScript errors
npm run lint              # Run ESLint

# Database
npm run prisma:generate   # Generate Prisma client
npm run db:push          # Push schema to DB
npm run db:seed          # Run seed script
npm run db:migrate       # Create migrations

# Build & Production
npm run build             # Build for production
npm run serve             # Run production build locally

# Code quality
npm run lint:fix          # Fix linting issues
npm run format            # Format code with Prettier
```

---

## 📋 Next Development Tasks

### Immediate (1-2 weeks)
1. Set up database connection
2. Build customer signup/login forms
3. Build laundry order form
4. Add loading & error states to forms
5. Test payment flow end-to-end

### Short term (2-4 weeks)
6. Build rider dashboard and job acceptance
7. Build admin approval workflow UI
8. Add order tracking page
9. Implement real-time updates with Socket.io
10. Add file upload for photos

### Medium term (1-2 months)
11. Google Maps integration
12. PDF certificate generation
13. Email & SMS notifications
14. Comprehensive testing
15. Security hardening

---

## 🔐 Security Notes

✅ **Implemented:**
- Password hashing with bcryptjs
- JWT token authentication
- HTTP-only cookies
- Role-based access control
- Input validation with Zod

⚠️ **Still Need:**
- Rate limiting on auth endpoints
- CORS configuration
- CSRF protection
- SQL injection prevention (Prisma handles this)
- XSS prevention

---

## 🐛 Troubleshooting

### "Cannot connect to database"
```bash
# Check if PostgreSQL is running
psql -U postgres

# Verify DATABASE_URL in .env.local
# Format: postgresql://user:password@localhost:5432/sparkle247
```

### "Prisma types not found"
```bash
npm run prisma:generate
```

### "Port 4028 already in use"
```bash
# Use a different port
PORT=3000 npm run dev
```

### TypeScript errors
```bash
npm run type-check    # See all errors
npm run lint:fix      # Auto-fix some issues
```

---

## 📞 API Testing

Use Postman or curl to test endpoints:

```bash
# Customer signup
curl -X POST http://localhost:4028/api/auth/customer/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","fullName":"Test User","phone":"09012345678"}'

# Customer login
curl -X POST http://localhost:4028/api/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Get pricing
curl http://localhost:4028/api/pricing
```

---

## 📖 Documentation Files

- `SETUP.md` - Detailed setup guide
- `MVP_STATUS.md` - Project status and progress
- `prompt.md` - Original project requirements
- `README.md` - Project overview

---

## 🎉 You're All Set!

The MVP backend is ready to go. All you need to do is:

1. ✅ Install dependencies (already done)
2. ⏳ Create PostgreSQL database
3. ⏳ Configure `.env.local`
4. ⏳ Run `npm run db:push && npm run db:seed`
5. ⏳ Start `npm run dev`
6. 🎨 Build the frontend forms and pages

**Happy coding! 🚀**

---

For questions or issues, refer to the main project documentation or check the SETUP.md file.

Last Updated: May 31, 2026
