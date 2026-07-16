# 247 Sparkle — Full-Stack Web Platform
## Complete Developer Brief

---

## PROJECT OVERVIEW

**Business Name:** 247 Sparkle Laundry & Cleaning Services
**Website:** www.247sparkle.com
**Email:** info.247sparkle@gmail.com / 247biz@gmail.com
**Phone:** 09039661885 / 07052258764 (WhatsApp)
**Location:** Otukpo, Benue State

**Brand Description (use verbatim on the website):**
> 247 Sparkle is a proudly indigenous brand committed to delivering reliable, high-quality laundry and apartment cleaning solutions tailored to your everyday needs. We understand the demands of busy schedules, which is why we provide seamless washing, professional cleaning, and convenient pick-up and delivery services designed to save you time and effort.
>
> Our approach is simple: consistent quality, attention to detail, and customer satisfaction at every touchpoint. Whether it's your daily wear, office outfits, or special fabrics, we handle every item with care, using effective cleaning methods that keep your clothes fresh, spotless, and long-lasting.
>
> With 247 Sparkle, you don't just get a service — you get peace of mind, knowing your laundry is in trusted hands, delivered back to you clean, crisp, and right on time.

---

## BRAND IDENTITY

### Logo Colors (extracted from logo.jpeg)
- **Gold/Yellow:** `#F5C200` — used for "247"
- **Red:** `#CC0000` — used for "Sparkle"
- **Dark Navy:** `#1A0A5E` — used for subtitle text
- **White:** `#FFFFFF` — backgrounds

### Brand Aesthetic Direction
- Hybrid: Tech-enabled platform (Uber/Bolt style) + Premium lifestyle feel
- Clean, modern, professional — not a basic local shop
- App-like UX with smooth interactions and step-by-step flows
- Nigerian market-first design: warm, trustworthy, aspirational

### Provided Image Assets
All images to be placed in `/public/images/`:

| Filename | Usage |
|----------|-------|
| `logo.jpeg` | Navbar, footer, favicon |
| `bg-image.jpeg` | Hero section background (laundry room with washing machine) |
| `Office_cleaning.jpeg` | Office cleaning service section |
| `equipments.jpeg` | About / equipment section (blue bucket with supplies) |
| `home_cleaning__2__.jpeg` | Home cleaning section (cleaner with trolley cart) |
| `Home_cleaning.jpeg` | Home cleaning detail (toilet scrubbing) |

---

## TECH STACK

- **Frontend:** Next.js (App Router) + Tailwind CSS
- **Backend:** Node.js + Express or Next.js API Routes
- **Database:** PostgreSQL
- **Authentication:** JWT-based (separate tokens per portal)
- **Real-time:** Socket.io (order status & rider location updates)
- **Payments:** Paystack (Nigerian payment gateway)
- **File Uploads:** Cloudinary or local storage (face photos, certificates)
- **Maps:** Google Maps API (pickup location selection + live rider tracking)
- **PDF Generation:** pdfkit or puppeteer (fumigation certificates)

---

## SYSTEM ARCHITECTURE

The platform has **5 portals**, each with its own layout and access level:

```
/                        → Public-facing marketing website
/customer/*              → Customer portal (JWT auth required)
/rider/*                 → Rider portal (JWT auth required)
/partner/*               → Laundry partner portal (JWT auth required)
/admin/*                 → Admin control panel (JWT auth required)
```

---

## PORTAL 1 — PUBLIC-FACING WEBSITE

### Pages

#### Homepage (`/`)
- **Navbar:** Logo (left), Links: Home | Services | How It Works | Become a Partner | Contact, CTA: "Book Now" button (right)
- **Hero Section:**
  - Background image: `bg-image.jpeg`
  - Headline: "Clean Clothes. Fresh Spaces. Delivered to You."
  - Sub-headline: "Otukpo's most reliable on-demand laundry, home cleaning and fumigation service."
  - Two CTAs: "Book a Service" → `/customer/signup` | "How It Works" → smooth scroll to section
- **How It Works (3 Steps):**
  1. Choose Your Service
  2. Schedule Pickup or Drop-off
  3. We Clean & Deliver Back to You
- **Services Grid (4 cards with icons/images):**
  - Laundry
  - Home Cleaning (image: `home_cleaning__2__.jpeg`)
  - Office Cleaning (image: `Office_cleaning.jpeg`)
  - Fumigation
- **Why Choose Us (trust badges):**
  - Licensed & Certified
  - Pickup & Delivery
  - Insured Items
  - Real-time Tracking
- **About Section:** Brand description text + `equipments.jpeg`
- **Testimonials:** 3 placeholder customer reviews
- **Partner CTA Banner:** "Are you a laundry business? Join our network and grow your revenue." → `/become-a-partner`
- **Footer:** Logo, navigation links, contact details, phone, email, WhatsApp link

#### Services Page (`/services`)
- Individual sections for each service with descriptions
- Laundry pricing table (prices managed from admin)
- Fumigation pricing by property type
- Home/Office cleaning CTA for quotation

#### How It Works Page (`/how-it-works`)
- Placeholder: "Our full process guide is coming soon."
- Content to be provided by the client later

#### Become a Partner Page (`/become-a-partner`)
- Two cards: "Register as a Laundry Business" → `/partner/signup` | "Register as a Rider" → `/rider/signup`
- Brief description of benefits for each role

#### Contact Page (`/contact`)
- Contact form: Name, Email, Phone, Message
- Phone: 09039661885
- WhatsApp: 07052258764
- Email: info.247sparkle@gmail.com
- Google Maps embed (Otukpo, Benue State — placeholder location)

#### Certificate Verification Page (`/verify`) — PUBLIC, NO LOGIN REQUIRED
- Input field: Enter Certificate Number
- On submit: fetch certificate details from database
- Display: Customer Name, Property Address, Date of Service, Service Type, Valid / Invalid status

---

## PORTAL 2 — CUSTOMER PORTAL

### Auth
- **Signup (`/customer/signup`):** Full Name, Email, Phone Number, Password, Confirm Password
- **Login (`/customer/login`):** Email, Password, "Forgot Password" link

### Dashboard (`/customer/dashboard`)
- Greeting: "Welcome back, [First Name]"
- Summary cards: Total Orders | Active Orders | Completed Orders
- Recent Orders (last 5) with status badges
- Quick action buttons: "New Order" | "Track Order"

### Place a New Order (`/customer/new-order`)

**Step 1 — Select Service:**
- Laundry
- Home Cleaning
- Fumigation

---

**If LAUNDRY selected:**

Step 2 — Select items with quantity (multi-select):

**Clothes:**
- Lace
- Jeans
- Agbada
- T-shirt
- Canvas / Sneaker
- Sportswear
- Curtains
- Bedsheets
- Towels

**Special Group:**
- White Items (Colour Group — separate wash, listed distinctly)

Unit prices are fetched dynamically from admin pricing table.

Step 3 — Pickup Option:
- "Pick up from my address" → enter address, select date & time
- "Drop at partner location" → show map of nearby approved partner shops

Step 4 — Delivery Details:
- Delivery address (default: same as pickup, editable)
- Preferred delivery date

Step 5 — Order Summary with itemised price breakdown

Step 6 — Paystack payment

---

**If HOME CLEANING selected:**

Step 2 — Select type:
- Residential Cleaning (fixed pricing)
- Office Cleaning → Request for Quotation
- Post-Construction Cleaning → Request for Quotation

Step 3 (Residential):
- Property Address
- Preferred Date and Time
- Special Instructions (optional text area)
- No rider or delivery involved — cleaner comes to location

Step 4 — Payment or Quotation submission confirmation

---

**If FUMIGATION selected:**

Step 2 — Select Property Type:

**(a) Residential** — fixed pricing:
- Single Room
- Self Contain
- 1 Room Apartment
- 2 Rooms Apartment
- 3 Rooms Apartment
- 4 Rooms Apartment

Prices fetched from admin pricing table.

**(b) Office** → Quotation form: Name, Business Name, Address, Phone, Message

**(c) Commercial Building** → Quotation form: same fields as above

**Fumigation rules:**
- NO pickup or delivery step
- NO rider assigned
- NO delivery charge
- Service is on-site only

Step 3 — Schedule date and time
Step 4 — Payment (residential fixed price) OR quotation submission

---

### Order Tracking (`/customer/orders/:id`)
- Visual status timeline:
  1. Order Placed
  2. Rider Assigned
  3. Picked Up
  4. In Cleaning / Service In Progress
  5. Out for Delivery / Nearly Done
  6. Delivered / Completed
- Live Google Maps view showing rider current location (for laundry pickup/delivery)
- Estimated time display
- Full order details panel

### Order History (`/customer/orders`)
- All orders listed with status, date, service type
- Filter by: Status | Service Type | Date Range
- Click any order to view full details

### Fumigation Certificates (`/customer/certificates`)
- List of all certificates issued to this customer
- Download PDF button per certificate
- Certificate includes: Certificate Number, 247 Sparkle branding, Customer Name, Property Address, Date of Service, Service Type, Authorisation signature line, Verification URL

### Profile (`/customer/profile`)
- Edit: Full Name, Email, Phone
- Saved addresses
- Change password

---

## PORTAL 3 — RIDER PORTAL

### Signup (`/rider/signup`)

**Fields:**
- Full Name
- Home Address
- Phone Number
- Email
- Password
- Face Photo Upload (JPG — for identity verification, stored securely)
- Availability Status on registration: Working | Off-Duty

**Bank Details:**
- Bank Name — dropdown using Paystack Banks API: `GET https://api.paystack.co/bank?country=nigeria`
- Account Number
- Account Name — auto-fetched via Paystack Resolve Account API: `GET https://api.paystack.co/bank/resolve?account_number=XXXX&bank_code=XXX`

**After signup:** Status is "Pending Approval." Rider CANNOT log in until admin approves.

### Login (`/rider/login`)

### Dashboard (`/rider/dashboard`)
- Name and profile summary
- Availability toggle: **Working ↔ Off-Duty** (updates in real-time to dispatch system)
- Assigned Jobs section — list of current job cards
- Earnings summary: Today | This Week | All Time
- Recent job history

### Active Job View (`/rider/job/:id`)
- Customer name and contact
- Pickup address + Google Maps link
- Delivery address + Google Maps link
- Service type and items
- Status action buttons (progresses order in sequence):
  - "Accept Job"
  - "Picked Up"
  - "Out for Delivery"
  - "Delivered"
- Each button tap updates order status via Socket.io in real-time

### Earnings (`/rider/earnings`)
- Commission rate: 20% per completed delivery
- Per-job breakdown (job ID, date, amount earned)
- Total wallet balance
- "Request Withdrawal" button — sends request to admin for manual bank transfer

### Profile (`/rider/profile`)
- Edit: Name, Address, Phone
- Update bank details
- Update availability status

---

## PORTAL 4 — LAUNDRY PARTNER PORTAL

### Signup (`/partner/signup`)

**Fields:**
- Business Name
- Shop Owner Full Name
- Shop Owner Clear Photo (JPG — face verification, stored securely)
- Full Business Address
- Phone Number
- Email
- Password
- Opening Time (time picker)
- Closing Time (time picker)
- Days of Opening (multi-select: Mon, Tue, Wed, Thu, Fri, Sat, Sun)

**Bank Details:**
- Bank Name — dropdown (Paystack Banks API)
- Account Number
- Account Name — auto-fetch (Paystack Resolve API)

**After signup:** Status is "Pending Approval." Partner CANNOT log in until admin approves.

### Login (`/partner/login`)

### Dashboard (`/partner/dashboard`)
- Business name and approval status
- **Workload Toggle:** "Shop Available" ↔ "Shop Full / Busy"
  - This status is visible to admin for routing decisions
  - If 247 Sparkle hub is overloaded, admin routes orders to partners showing "Available"
- Incoming Orders table: orders dropped off or assigned to this partner
  - Columns: Order ID | Service Type | Customer | Status | Action
  - Action button: "Mark Ready for Pickup" when order is done
- Revenue summary: Earnings this month | Commission deducted | Net payout

### Profile (`/partner/profile`)
- Edit: Business name, address, phone
- Update operating hours and days
- Update bank details

---

## PORTAL 5 — ADMIN DASHBOARD

### Login (`/admin/login`)
Separate secure login. Admin accounts are seeded manually in the database.

### Dashboard Overview (`/admin/dashboard`)
- Live stat cards: Orders Today | Active Riders | Registered Partners | Revenue Today
- Recent orders feed (last 10 with status)
- Alerts panel: Pending rider approvals | Pending partner approvals | New quotation requests

### Orders Management (`/admin/orders`)
- Full orders table with search + filters (Status, Service Type, Date, Customer Name)
- View any order in full detail
- Manually assign a rider to any unassigned order
- Update order status manually
- View payment status (Paid | Pending | Failed)

### Riders Management (`/admin/riders`)
- All riders listed with: Name, Phone, Status, Availability, Wallet Balance
- Status: Pending Approval | Active | Suspended
- Approve or Reject new rider applications (view face photo before approving)
- Suspend or reactivate a rider
- View full earnings and commission history
- Process withdrawal requests: mark as Paid after bank transfer

### Partner Management (`/admin/partners`)
- All partners listed with: Business Name, Owner, Status, Workload Status
- Status: Pending Approval | Active | Suspended
- Approve or Reject new partner applications (view owner photo before approving)
- View partner workload (Available / Busy) — use to route overflow orders
- View partner commission and order history

### Customer Management (`/admin/customers`)
- All customers with: Name, Email, Phone, Total Orders
- View individual customer order history

### Finance (`/admin/finance`)
- Total platform revenue
- Rider commissions: Pending | Paid
- Partner commissions: Pending | Paid
- Paystack transaction log

### Fumigation Certificates (`/admin/certificates`)
- Issue new certificate after fumigation order is marked "Completed"
- Auto-generate Certificate Number: `SPKFUM-YYYY-XXXXX`
- Certificate fields: Customer Name, Property Address, Property Type, Date of Service
- Download / Print PDF certificate
- Certificate verification lookup: search by certificate number

### Quotation Requests (`/admin/quotations`)
- All quotation requests for Office Cleaning and Commercial/Office Fumigation
- Respond with price via in-platform notification or email

### Pricing Management (`/admin/pricing`)
- Edit unit price for each laundry item (Lace, Jeans, Agbada, etc.)
- Edit fumigation residential prices per property type
- Changes take effect immediately in the customer booking flow

---

## COMMISSION & PRICING LOGIC

### Rider Commission
- Riders earn **20% of the delivery fee** per completed laundry order
- Commission tracked in rider wallet balance
- Rider requests withdrawal via dashboard; admin processes via bank transfer

### Partner Commission Model
- Each registered partner has their service prices stored in the system
- 247 Sparkle adds its own commission percentage and operational cost on top
- Customer-facing price = Partner price + 247 Sparkle margin
- Partner sees their net earnings; admin sees full revenue breakdown

### Smart Pricing Engine (`pricing-engine.js`)
```
Final Price = (Base Service Price + Distance Cost) × Demand Multiplier

- Base Price: set per item/service type in admin
- Distance Cost: distance in km × ₦200 per km
- Demand Multiplier:
    > 0.7 demand → 1.5× (peak surge)
    > 0.4 demand → 1.2× (moderate)
    default       → 1.0× (normal)
```

---

## REAL-TIME ORDER LIFECYCLE

### Laundry Orders (with pickup/delivery)
```
1. Customer places order + pays via Paystack
2. Admin or auto-dispatch assigns nearest available rider
3. Rider receives notification → accepts job
4. Status: "Rider Assigned"
5. Rider picks up from customer or partner drop-off point
6. Status: "Picked Up"
7. Item arrives at hub or partner shop
8. Status: "In Cleaning"
9. Cleaning complete
10. Status: "Out for Delivery"
11. Rider delivers to customer
12. Status: "Delivered"
13. Rider commission (20%) automatically credited to rider wallet
```

### Fumigation / Home Cleaning / Office Cleaning (on-site)
```
1. Customer places order + pays (or submits quotation request)
2. Admin schedules team visit
3. Status: "Scheduled"
4. Team visits property
5. Status: "In Progress"
6. Service completed
7. Status: "Completed"
8. (Fumigation only) Admin issues Fumigation Certificate
9. Certificate appears in customer dashboard for download
```

### Socket.io Events
- `order:status_update` — broadcast to customer and rider when status changes
- `rider:location_update` — rider app emits GPS position every 10 seconds
- `order:assigned` — notify rider of new job

---

## PAYSTACK INTEGRATION

**Initialize Payment:**
```
POST https://api.paystack.co/transaction/initialize
Body: { email, amount (in kobo = amount × 100) }
Headers: { Authorization: Bearer PAYSTACK_SECRET_KEY }
Response: { data: { authorization_url, reference } }
→ Redirect customer to authorization_url
```

**Verify Payment:**
```
GET https://api.paystack.co/transaction/verify/:reference
Headers: { Authorization: Bearer PAYSTACK_SECRET_KEY }
→ Check status === 'success' before updating order to "Paid"
```

**Banks List (for dropdowns):**
```
GET https://api.paystack.co/bank?country=nigeria
→ Returns array of { name, code } — use for rider/partner bank name dropdown
```

**Resolve Account Name:**
```
GET https://api.paystack.co/bank/resolve?account_number=XXXX&bank_code=XXX
→ Returns { account_name } — auto-fill on form
```

---

## FUMIGATION CERTIFICATE SPECIFICATION

- **Format:** PDF, downloadable
- **Certificate Number Format:** `SPKFUM-YYYY-XXXXX` (e.g., `SPKFUM-2025-00001`)
- **Certificate PDF Contents:**
  - 247 Sparkle logo (top center)
  - Title: "CERTIFICATE OF FUMIGATION"
  - Issued to: [Customer Full Name]
  - Property Address: [Full Address]
  - Property Type: [e.g., 2 Rooms Apartment]
  - Date of Service: [DD/MM/YYYY]
  - Certificate Number: [SPKFUM-YYYY-XXXXX]
  - Statement: "This property has been professionally fumigated by 247 Sparkle Laundry & Cleaning Services and meets the required health and safety standards."
  - Authorised by: [signature line]
  - Verification note: "Verify this certificate at www.247sparkle.com/verify"
  - Footer: Company contact details

---

## DATABASE SCHEMA

```sql
-- Customers
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  service_type TEXT NOT NULL, -- 'laundry' | 'home_cleaning' | 'office_cleaning' | 'fumigation'
  status TEXT DEFAULT 'pending',
  pickup_option TEXT, -- 'home_pickup' | 'partner_dropoff' | 'on_site'
  pickup_address TEXT,
  delivery_address TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  total_amount DECIMAL(10,2),
  payment_status TEXT DEFAULT 'unpaid', -- 'unpaid' | 'paid' | 'failed'
  paystack_reference TEXT,
  rider_id UUID REFERENCES riders(id),
  partner_id UUID REFERENCES partners(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Order Items (laundry)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  item_name TEXT NOT NULL,
  is_white_group BOOLEAN DEFAULT FALSE,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2),
  subtotal DECIMAL(10,2)
);

-- Riders
CREATE TABLE riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  face_photo_url TEXT,
  approval_status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'suspended'
  availability TEXT DEFAULT 'off_duty', -- 'working' | 'off_duty'
  current_lat DECIMAL(9,6),
  current_lng DECIMAL(9,6),
  bank_name TEXT,
  bank_code TEXT,
  account_number TEXT,
  account_name TEXT,
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Partners (laundry businesses)
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_photo_url TEXT,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  opening_time TIME,
  closing_time TIME,
  days_of_opening TEXT[], -- e.g. ['Mon','Tue','Wed']
  workload_status TEXT DEFAULT 'available', -- 'available' | 'busy'
  approval_status TEXT DEFAULT 'pending',
  bank_name TEXT,
  bank_code TEXT,
  account_number TEXT,
  account_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pricing
CREATE TABLE pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL, -- 'laundry' | 'fumigation'
  item_name TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Fumigation Certificates
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id),
  customer_name TEXT NOT NULL,
  property_address TEXT NOT NULL,
  property_type TEXT NOT NULL,
  service_date DATE NOT NULL,
  issued_at TIMESTAMP DEFAULT NOW()
);

-- Commissions
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  rider_id UUID REFERENCES riders(id),
  amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending', -- 'pending' | 'paid'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quotation Requests
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL, -- 'office_cleaning' | 'office_fumigation' | 'commercial_fumigation'
  contact_name TEXT,
  business_name TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  message TEXT,
  status TEXT DEFAULT 'new', -- 'new' | 'responded' | 'converted'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API ROUTES SUMMARY

```
# Auth
POST   /api/auth/customer/signup
POST   /api/auth/customer/login
POST   /api/auth/rider/signup
POST   /api/auth/rider/login
POST   /api/auth/partner/signup
POST   /api/auth/partner/login
POST   /api/auth/admin/login

# Orders
GET    /api/orders                    (admin)
POST   /api/orders                    (customer)
GET    /api/orders/:id
PUT    /api/orders/:id/status

# Payment
POST   /api/payment/initialize
GET    /api/payment/verify/:reference

# Riders (admin)
GET    /api/riders
PUT    /api/riders/:id/approve
PUT    /api/riders/:id/availability
GET    /api/riders/:id/earnings
POST   /api/riders/:id/withdrawal

# Partners (admin)
GET    /api/partners
PUT    /api/partners/:id/approve
PUT    /api/partners/:id/workload

# Certificates
GET    /api/certificates/verify/:number    (public)
POST   /api/certificates                   (admin)
GET    /api/certificates/customer/:userId  (customer)

# Banks
GET    /api/banks                     (Paystack proxy)
GET    /api/banks/resolve             (Paystack proxy)

# Pricing
GET    /api/pricing
PUT    /api/pricing                   (admin only)

# Quotations
POST   /api/quotations               (public)
GET    /api/quotations               (admin)
PUT    /api/quotations/:id           (admin responds)
```

---

## FOLDER STRUCTURE

```
247sparkle/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  # Homepage
│   │   ├── services/page.tsx
│   │   ├── how-it-works/page.tsx
│   │   ├── become-a-partner/page.tsx
│   │   ├── contact/page.tsx
│   │   └── verify/page.tsx           # Certificate verification (public)
│   ├── customer/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── new-order/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── orders/[id]/page.tsx
│   │   ├── certificates/page.tsx
│   │   └── profile/page.tsx
│   ├── rider/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── job/[id]/page.tsx
│   │   ├── earnings/page.tsx
│   │   └── profile/page.tsx
│   ├── partner/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── dashboard/page.tsx
│   │   └── profile/page.tsx
│   └── admin/
│       ├── login/page.tsx
│       ├── dashboard/page.tsx
│       ├── orders/page.tsx
│       ├── riders/page.tsx
│       ├── partners/page.tsx
│       ├── customers/page.tsx
│       ├── finance/page.tsx
│       ├── certificates/page.tsx
│       ├── quotations/page.tsx
│       └── pricing/page.tsx
├── components/
│   ├── ui/
│   ├── public/
│   ├── customer/
│   ├── rider/
│   ├── partner/
│   └── admin/
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── paystack.ts
│   ├── socket.ts
│   └── pricing-engine.ts
├── public/
│   └── images/
│       ├── logo.jpeg
│       ├── bg-image.jpeg
│       ├── Office_cleaning.jpeg
│       ├── equipments.jpeg
│       ├── home_cleaning__2__.jpeg
│       └── Home_cleaning.jpeg
└── prisma/
    └── schema.prisma
```

---

## IMPORTANT BUSINESS RULES

1. **Fumigation = on-site only.** No rider assigned. No pickup/delivery step. No delivery charge.
2. **Home/Office cleaning = on-site only.** Cleaner travels to customer. No laundry rider involved.
3. **Rider dispatch applies to laundry orders only.** Assign by nearest available rider (Haversine distance formula).
4. **Partner workload is visible to admin.** Used to route overflow from 247 Sparkle hub to Available partner shops.
5. **Partner pricing is stored per vendor.** Customer price = Partner price + 247 Sparkle commission + operational cost.
6. **Riders cannot log in until admin approves their signup.**
7. **Partners cannot log in until admin approves their signup.**
8. **White clothes are a separate laundry category** — listed under "Colour Group: White" to prevent mixing.
9. **"How It Works" page content will be provided later.** Use a placeholder for now.
10. **Certificate verification is fully public** — no login required at `/verify`.
11. **Fumigation certificate is downloadable as PDF** from the customer dashboard after service is completed.

---

## PRODUCTION CHECKLIST

- [ ] All secrets in `.env` (Paystack keys, DB URL, JWT secret, Google Maps API key)
- [ ] HTTPS enforced (Vercel or NGINX)
- [ ] JWT middleware on all protected routes
- [ ] Input validation on all forms (Zod recommended)
- [ ] File upload validation (type: JPG/PNG only, max size: 2MB)
- [ ] SQL injection protection (Prisma ORM or parameterized queries)
- [ ] Rate limiting on auth and payment endpoints
- [ ] Mobile responsive on all pages and portals
- [ ] Paystack test mode during development, switch to live keys before launch
- [ ] Error handling with user-friendly messages (no raw stack traces to frontend)
- [ ] Loading states on all async actions

---

*Developer Brief prepared for: 247 Sparkle Laundry & Cleaning Services*
*Version: 1.0 — Full Platform Build*
*Prepared: April 2026*
