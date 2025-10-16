-- Migration: Add extended nutritional fields
-- SAFE FOR PRODUCTION: Uses IF NOT EXISTS and preserves all existing data

-- Add missing nutritional fields that weren't in the initial migration
ALTER TABLE "nutritional_info" ADD COLUMN IF NOT EXISTS "servingsPerPackage" DOUBLE PRECISION;
ALTER TABLE "nutritional_info" ADD COLUMN IF NOT EXISTS "lactose" DOUBLE PRECISION;
ALTER TABLE "nutritional_info" ADD COLUMN IF NOT EXISTS "galactose" DOUBLE PRECISION;
ALTER TABLE "nutritional_info" ADD COLUMN IF NOT EXISTS "alcoholContent" DOUBLE PRECISION;
ALTER TABLE "nutritional_info" ADD COLUMN IF NOT EXISTS "omega3" DOUBLE PRECISION;
ALTER TABLE "nutritional_info" ADD COLUMN IF NOT EXISTS "omega6" DOUBLE PRECISION;
ALTER TABLE "nutritional_info" ADD COLUMN IF NOT EXISTS "monounsaturatedFat" DOUBLE PRECISION;
ALTER TABLE "nutritional_info" ADD COLUMN IF NOT EXISTS "polyunsaturatedFat" DOUBLE PRECISION;
ALTER TABLE "nutritional_info" ADD COLUMN IF NOT EXISTS "cholesterol" DOUBLE PRECISION;
ALTER TABLE "nutritional_info" ADD COLUMN IF NOT EXISTS "epa" DOUBLE PRECISION;
ALTER TABLE "nutritional_info" ADD COLUMN IF NOT EXISTS "dha" DOUBLE PRECISION;
ALTER TABLE "nutritional_info" ADD COLUMN IF NOT EXISTS "linolenicAcid" DOUBLE PRECISION;

