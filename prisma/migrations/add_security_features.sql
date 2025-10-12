-- Adicionar campos de bloqueio automático ao User
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "lastFailedLogin" TIMESTAMP(3);

-- Criar índice para lockedUntil
CREATE INDEX IF NOT EXISTS "user_lockedUntil_idx" ON "user"("lockedUntil");

-- Adicionar campos de rastreamento à Session
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "loginMethod" TEXT;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "deviceName" TEXT;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "isRevoked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "revokedReason" TEXT;

-- Criar índice para isRevoked
CREATE INDEX IF NOT EXISTS "session_isRevoked_idx" ON "session"("isRevoked");

-- Criar tabela SecurityAudit
CREATE TABLE IF NOT EXISTS "security_audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "security_audit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Criar índices para SecurityAudit
CREATE INDEX IF NOT EXISTS "security_audit_userId_eventType_idx" ON "security_audit"("userId", "eventType");
CREATE INDEX IF NOT EXISTS "security_audit_createdAt_idx" ON "security_audit"("createdAt");
CREATE INDEX IF NOT EXISTS "security_audit_ipAddress_idx" ON "security_audit"("ipAddress");

-- Criar tabela SecurityNotification
CREATE TABLE IF NOT EXISTS "security_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "security_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Criar índices para SecurityNotification
CREATE INDEX IF NOT EXISTS "security_notifications_userId_isRead_idx" ON "security_notifications"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "security_notifications_createdAt_idx" ON "security_notifications"("createdAt");

-- Criar tabela IpLocation
CREATE TABLE IF NOT EXISTS "ip_locations" (
    "ip" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL
);

-- Criar índice para IpLocation
CREATE INDEX IF NOT EXISTS "ip_locations_expiresAt_idx" ON "ip_locations"("expiresAt");
