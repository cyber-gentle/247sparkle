-- Server-only Supabase posture: prevent anon and authenticated client roles
-- from querying application tables directly. 247Sparkle accesses PostgreSQL
-- through its trusted Prisma database connection; no client-table policies are
-- intentionally created here.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "riders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "partners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pricing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "commissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "withdrawal_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "certificates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quotations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rate_limit_buckets" ENABLE ROW LEVEL SECURITY;
