-- Migration: Add discount fields to Purchase and PurchaseItem
-- SAFE FOR PRODUCTION: Uses IF NOT EXISTS and preserves all existing data

-- Add discount fields to Purchase table
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "totalDiscount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "finalAmount" DOUBLE PRECISION;

-- Add discount fields to PurchaseItem table
ALTER TABLE "purchase_items" ADD COLUMN IF NOT EXISTS "unitDiscount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "purchase_items" ADD COLUMN IF NOT EXISTS "totalDiscount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "purchase_items" ADD COLUMN IF NOT EXISTS "finalPrice" DOUBLE PRECISION;

-- Update NULL values to defaults (safe, only affects NULL values)
UPDATE "purchases" SET "totalDiscount" = 0 WHERE "totalDiscount" IS NULL;
UPDATE "purchase_items" SET "unitDiscount" = 0 WHERE "unitDiscount" IS NULL;
UPDATE "purchase_items" SET "totalDiscount" = 0 WHERE "totalDiscount" IS NULL;

-- Calculate finalAmount for existing purchases (where finalAmount is NULL)
UPDATE "purchases" SET "finalAmount" = "totalAmount" - COALESCE("totalDiscount", 0) WHERE "finalAmount" IS NULL;

-- Calculate finalPrice for existing purchase items (where finalPrice is NULL)
UPDATE "purchase_items" SET "finalPrice" = "totalPrice" - COALESCE("totalDiscount", 0) WHERE "finalPrice" IS NULL;

