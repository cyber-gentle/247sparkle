# MVP Testing Guide - 247 Sparkle

## Overview
This guide walks through testing the complete MVP flow from customer signup through rider job acceptance.

## Prerequisites

### Required Services
- Node.js and npm running the dev server (`npm run dev`)
- PostgreSQL database running (for production data)
- SQLite database (created automatically in development via Prisma)

### Environment Setup
```bash
# Install dependencies
npm install

# Create .env.local with valid database connection
DATABASE_URL="postgresql://user:password@localhost:5432/sparkle247"
JWT_SECRET="dev-secret-key-12345"
PAYSTACK_SECRET_KEY="sk_test_xxx"
PAYSTACK_PUBLIC_KEY="pk_test_xxx"

# Push schema to database
npm run db:push

# Seed default data (admin user + pricing)
npm run db:seed

# Start dev server
npm run dev -- -p 3000
```

## Testing Workflow

### Phase 1: Customer Registration & Login

#### 1.1 Customer Signup
1. Navigate to `http://localhost:3000/customer/signup`
2. Fill in form:
   - Full Name: "Test Customer"
   - Email: "customer@test.com"
   - Phone: "09012345678"
   - Password: "password123"
   - Confirm: "password123"
3. Click "Create Customer Account"
4. **Expected**: Redirects to `/customer/login` with success toast

#### 1.2 Customer Login
1. Navigate to `http://localhost:3000/customer/login`
2. Enter credentials:
   - Email: "customer@test.com"
   - Password: "password123"
3. Click "Login"
4. **Expected**: 
   - Sets `auth_token` cookie
   - Redirects to `/customer/dashboard`

### Phase 2: Order Creation

#### 2.1 Create Order
1. From customer dashboard, click "New Order" or navigate to `/customer/new-order`
2. **Step 1 - Service Selection**: Select "Laundry Service"
3. **Step 2 - Item Selection**: 
   - Select 2 items (e.g., White Shirts ×2, Trousers ×1)
   - Click "Next"
4. **Step 3 - Pickup Option**: 
   - Select "We Pick Up from Your Home"
   - Click "Next"
5. **Step 4 - Delivery Details**:
   - Address: "123 Main Street, Lagos"
   - Delivery Date: Select future date
   - Click "Review Order"
6. **Step 5 - Order Summary**:
   - Verify total calculated correctly (₦600 + ₦400 = ₦1000)
   - Click "Proceed to Payment"
7. **Expected**: 
   - If database connected: Redirects to Paystack payment
   - If no database: 500 error (expected, shows API integration works)

### Phase 3: Rider Workflow

#### 3.1 Rider Signup
1. Navigate to `http://localhost:3000/rider/signup`
2. Fill form with required details:
   - Full Name: "Test Rider"
   - Email: "rider@test.com"
   - Phone: "09087654321"
   - Password: "password123"
   - Bank Details (dummy values acceptable)
3. Click "Sign Up as Rider"
4. **Expected**: Redirects to rider login (approval pending)

#### 3.2 Admin Approval of Rider
1. Using admin credentials (from seed: admin@247sparkle.com/admin123):
   - POST to `/api/admin/riders/{riderId}`
   - Body: `{ "action": "APPROVE" }`
2. **Expected**: Rider now has `approvalStatus='APPROVED'`

#### 3.3 Rider Login & Job View
1. Navigate to `http://localhost:3000/rider/login`
2. Enter rider credentials:
   - Email: "rider@test.com"
   - Password: "password123"
3. Click "Login"
4. **Expected**: Redirects to `/rider/dashboard`

#### 3.4 Available Jobs
1. On rider dashboard, view list of available jobs
2. Each job card shows:
   - Order number & service type
   - Customer phone number (clickable)
   - Pickup and delivery addresses
   - Item count & creation date
   - Amount (commission calculated as 15%)
3. **Expected**: Shows paid orders waiting for rider assignment

#### 3.5 Accept Job
1. Click "Accept Job" on any available job
2. **Expected**:
   - Button shows loading state
   - Job accepted successfully (toast notification)
   - Job removed from available list
   - Commission record created (15% of order total)

#### 3.6 Job Details & Status Updates
1. After accepting job, navigate to job detail page or `/rider/job/{orderId}`
2. View complete job details:
   - Customer name, phone, email
   - Pickup and delivery addresses
   - Items and total amount
   - Current delivery progress
3. Update job status by clicking status progression buttons:
   - Click "Mark as IN_TRANSIT" → shows "Out for Delivery"
   - Click "Mark as ARRIVED" → shows "At Destination"
   - Click "Mark as COMPLETED" → shows "Delivery Complete"
4. **Expected**: Each status update succeeds, UI updates to show progress

### Phase 4: Customer Order Tracking

#### 4.1 View Orders
1. From customer dashboard, click "View Orders" or navigate to `/customer/orders`
2. View order list with:
   - Order number
   - Service type
   - Items ordered
   - Total amount
   - Current status
   - Payment status
3. **Expected**: Shows created order with RIDER_ASSIGNED status

#### 4.2 Track Order
1. Click on order to view details
2. See:
   - Assigned rider information
   - Pickup and delivery addresses
   - Real-time status (in-transit, arrived, etc.)
   - Order timeline
3. **Expected**: Updates reflect rider's status changes

### Phase 5: Data Validation Tests

#### 5.1 Form Validation
- Try signup with invalid email → Shows error
- Try login with wrong password → Shows "Invalid credentials"
- Try order with no items → Shows validation error
- Try delivery date in the past → Shows validation error

#### 5.2 Authorization Tests
- Try accessing `/customer/dashboard` without login → Redirects to login
- Try accessing `/rider/job/{id}` as customer → Shows 403 Forbidden
- Try accessing admin endpoints as regular user → Returns 401

#### 5.3 Data Integrity Tests
- Create multiple orders → Each gets unique ID
- Accept same job twice → Second attempt shows "Order no longer available"
- Check commission calculation → 15% of order total stored correctly

## API Endpoints Reference

### Customer APIs
- `POST /api/auth/customer/signup` - Register customer
- `POST /api/auth/customer/login` - Login customer
- `POST /api/orders` - Create order (requires auth)
- `GET /api/orders` - Get customer's orders (requires auth)
- `POST /api/payment/verify/[reference]` - Verify Paystack payment

### Rider APIs
- `POST /api/auth/rider/signup` - Register rider
- `POST /api/auth/rider/login` - Login rider (requires approval)
- `GET /api/riders/jobs` - Get available jobs (requires auth)
- `POST /api/riders/jobs/[id]/accept` - Accept job (requires auth)
- `POST /api/riders/location` - Update rider location
- `GET /api/riders/location` - Get rider location
- `POST /api/orders/[id]/status` - Update order status

### Admin APIs
- `POST /api/admin/riders/[id]` - Approve/suspend rider
- `GET /api/admin/riders` - List all riders
- `GET /api/admin/orders` - Get all orders (admin view)

## Troubleshooting

### Issue: "Can't reach database server"
**Solution**: Ensure PostgreSQL is running or switch to SQLite for development

### Issue: Middleware redirects to login on protected routes
**Solution**: Check that auth_token cookie is being set. Verify JWT_SECRET matches between signup and login

### Issue: "Rider not approved" error when logging in
**Solution**: Use admin endpoint to approve rider first (see Phase 3.2)

### Issue: Order status doesn't update
**Solution**: Verify rider is the one updating (x-user-id header must match order.riderId)

### Issue: "Order no longer available" when accepting job
**Solution**: Ensure order payment status is 'PAID'. Check that order.riderId is null

## Success Criteria

✅ Customer can signup and login
✅ Customer can create multi-step order with items selection
✅ Customer sees order in dashboard
✅ Rider can signup and view available jobs
✅ Rider can accept job (order assigned, commission created)
✅ Rider can update job status through progress tracking
✅ Customer sees real-time status updates
✅ All validations work correctly
✅ Authentication prevents unauthorized access

## Next Steps (Post-MVP)

1. **Real-time Updates**: Implement Socket.io for live job notifications and order tracking
2. **Maps Integration**: Add Google Maps for route visualization
3. **Payment Processing**: Connect to real Paystack account for production
4. **File Uploads**: Implement Cloudinary integration for rider photos
5. **Notifications**: Add email/SMS notifications for order status changes
6. **Analytics**: Dashboard showing metrics (daily earnings, completed orders, etc.)
7. **Admin Dashboard**: Full admin UI for order management and metrics
8. **Mobile App**: React Native mobile clients for customers and riders

---

**Last Updated**: June 5, 2026
**MVP Version**: 1.0.0
