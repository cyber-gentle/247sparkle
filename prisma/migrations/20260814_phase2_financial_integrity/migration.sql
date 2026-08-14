-- Phase 2: canonicalize financial calculations in kobo, add payment-event
-- idempotency, and protect high-frequency order lookup paths.
ALTER TABLE "riders" ADD COLUMN IF NOT EXISTS "walletBalanceKobo" INTEGER NOT NULL DEFAULT 0;
UPDATE "riders" SET "walletBalanceKobo" = ROUND("walletBalance" * 100)::INTEGER WHERE "walletBalanceKobo" = 0 AND "walletBalance" <> 0;

ALTER TABLE "pricing" ADD COLUMN IF NOT EXISTS "unitPriceKobo" INTEGER NOT NULL DEFAULT 0;
UPDATE "pricing" SET "unitPriceKobo" = ROUND("unitPrice" * 100)::INTEGER WHERE "unitPriceKobo" = 0 AND "unitPrice" <> 0;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "totalKobo" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentConfirmedAt" TIMESTAMP(3);
UPDATE "orders" SET "totalKobo" = ROUND("totalAmount" * 100)::INTEGER WHERE "totalKobo" = 0 AND "totalAmount" <> 0;
UPDATE "orders" SET "status" = 'PAID_UNASSIGNED' WHERE "paymentStatus" = 'PAID' AND "riderId" IS NULL AND "status" IN ('PENDING', 'RIDER_ASSIGNED');

ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "unitPriceKobo" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "subtotalKobo" INTEGER NOT NULL DEFAULT 0;
UPDATE "order_items" SET "unitPriceKobo" = ROUND("unitPrice" * 100)::INTEGER WHERE "unitPriceKobo" = 0 AND "unitPrice" <> 0;
UPDATE "order_items" SET "subtotalKobo" = ROUND("subtotal" * 100)::INTEGER WHERE "subtotalKobo" = 0 AND "subtotal" <> 0;

ALTER TABLE "commissions" ADD COLUMN IF NOT EXISTS "amountKobo" INTEGER NOT NULL DEFAULT 0;
UPDATE "commissions" SET "amountKobo" = ROUND("amount" * 100)::INTEGER WHERE "amountKobo" = 0 AND "amount" <> 0;

ALTER TABLE "withdrawal_requests" ADD COLUMN IF NOT EXISTS "amountKobo" INTEGER NOT NULL DEFAULT 0;
UPDATE "withdrawal_requests" SET "amountKobo" = ROUND("amount" * 100)::INTEGER WHERE "amountKobo" = 0 AND "amount" <> 0;

ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "quotedPriceKobo" INTEGER;
UPDATE "quotations" SET "quotedPriceKobo" = ROUND("quotedPrice" * 100)::INTEGER WHERE "quotedPrice" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_paystackReference_key" ON "orders"("paystackReference");
CREATE INDEX IF NOT EXISTS "orders_paymentStatus_riderId_status_idx" ON "orders"("paymentStatus", "riderId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "commissions_orderId_riderId_key" ON "commissions"("orderId", "riderId");
CREATE INDEX IF NOT EXISTS "audit_logs_entityType_entityId_createdAt_idx" ON "audit_logs"("entityType", "entityId", "createdAt");

CREATE TABLE IF NOT EXISTS "payment_events" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'PAYSTACK',
  "reference" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PROCESSED',
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "payment_events_provider_reference_key" ON "payment_events"("provider", "reference");
CREATE INDEX IF NOT EXISTS "payment_events_orderId_processedAt_idx" ON "payment_events"("orderId", "processedAt");
