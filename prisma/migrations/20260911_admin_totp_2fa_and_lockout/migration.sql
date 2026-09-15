-- TOTP two-factor authentication for admin accounts, plus per-account
-- lockout on failed password attempts.

ALTER TABLE "users" ADD COLUMN "twoFactorSecret" TEXT,
ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lockedUntil" TIMESTAMP(3);
