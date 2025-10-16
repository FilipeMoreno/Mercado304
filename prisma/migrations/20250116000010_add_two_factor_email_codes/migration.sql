-- CreateTable
CREATE TABLE IF NOT EXISTS "two_factor_email_code" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EMAIL',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "two_factor_email_code_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "two_factor_email_code_userId_idx" ON "two_factor_email_code"("userId");
CREATE INDEX IF NOT EXISTS "two_factor_email_code_expiresAt_idx" ON "two_factor_email_code"("expiresAt");
CREATE INDEX IF NOT EXISTS "two_factor_email_code_used_idx" ON "two_factor_email_code"("used");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'two_factor_email_code_userId_fkey'
    ) THEN
        ALTER TABLE "two_factor_email_code" 
        ADD CONSTRAINT "two_factor_email_code_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

