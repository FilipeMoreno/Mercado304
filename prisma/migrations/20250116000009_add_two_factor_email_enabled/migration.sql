-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "twoFactorEmailEnabled" BOOLEAN DEFAULT false;

