-- Migration: Add security features (audit, notifications, IP tracking, session management)
-- SAFE FOR PRODUCTION: Uses IF NOT EXISTS and preserves all existing data

-- Add automatic lockout fields to User table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "lastFailedLogin" TIMESTAMP(3);

-- Create index for lockedUntil
CREATE INDEX IF NOT EXISTS "user_lockedUntil_idx" ON "user"("lockedUntil");

-- Add session tracking fields to Session table
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "loginMethod" TEXT;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "deviceName" TEXT;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "isRevoked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "revokedReason" TEXT;

-- Create index for isRevoked
CREATE INDEX IF NOT EXISTS "session_isRevoked_idx" ON "session"("isRevoked");

-- Create SecurityAudit table
CREATE TABLE IF NOT EXISTS "security_audit" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "security_audit_pkey" PRIMARY KEY ("id")
);

-- Add foreign key for SecurityAudit if table was just created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'security_audit_userId_fkey'
    ) THEN
        ALTER TABLE "security_audit" 
        ADD CONSTRAINT "security_audit_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes for SecurityAudit
CREATE INDEX IF NOT EXISTS "security_audit_userId_eventType_idx" ON "security_audit"("userId", "eventType");
CREATE INDEX IF NOT EXISTS "security_audit_createdAt_idx" ON "security_audit"("createdAt");
CREATE INDEX IF NOT EXISTS "security_audit_ipAddress_idx" ON "security_audit"("ipAddress");

-- Create SecurityNotification table
CREATE TABLE IF NOT EXISTS "security_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "security_notifications_pkey" PRIMARY KEY ("id")
);

-- Add foreign key for SecurityNotification if table was just created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'security_notifications_userId_fkey'
    ) THEN
        ALTER TABLE "security_notifications" 
        ADD CONSTRAINT "security_notifications_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes for SecurityNotification
CREATE INDEX IF NOT EXISTS "security_notifications_userId_isRead_idx" ON "security_notifications"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "security_notifications_createdAt_idx" ON "security_notifications"("createdAt");

-- Create IpLocation table
CREATE TABLE IF NOT EXISTS "ip_locations" (
    "ip" TEXT NOT NULL,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "ip_locations_pkey" PRIMARY KEY ("ip")
);

-- Create index for IpLocation
CREATE INDEX IF NOT EXISTS "ip_locations_expiresAt_idx" ON "ip_locations"("expiresAt");

-- Update NULL values to defaults for new fields
UPDATE "user" SET "failedLoginAttempts" = 0 WHERE "failedLoginAttempts" IS NULL;
UPDATE "session" SET "isRevoked" = false WHERE "isRevoked" IS NULL;

