-- Migration: Add temporary item fields to ShoppingListItem
-- SAFE FOR PRODUCTION: Uses IF NOT EXISTS and preserves all existing data

-- Add temporary item fields to shopping_list_items table
ALTER TABLE "shopping_list_items" ADD COLUMN IF NOT EXISTS "isTemporary" BOOLEAN DEFAULT false;
ALTER TABLE "shopping_list_items" ADD COLUMN IF NOT EXISTS "tempDescription" TEXT;
ALTER TABLE "shopping_list_items" ADD COLUMN IF NOT EXISTS "tempBarcode" TEXT;
ALTER TABLE "shopping_list_items" ADD COLUMN IF NOT EXISTS "tempBrand" TEXT;
ALTER TABLE "shopping_list_items" ADD COLUMN IF NOT EXISTS "tempCategory" TEXT;
ALTER TABLE "shopping_list_items" ADD COLUMN IF NOT EXISTS "tempNotes" TEXT;

-- Update NULL values to defaults (safe, only affects NULL values)
UPDATE "shopping_list_items" SET "isTemporary" = false WHERE "isTemporary" IS NULL;

