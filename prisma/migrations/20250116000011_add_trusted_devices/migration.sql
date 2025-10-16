-- CreateTable
CREATE TABLE "public"."trustedDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trustedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trustedDevice_userId_idx" ON "public"."trustedDevice"("userId");

-- AddForeignKey
ALTER TABLE "public"."trustedDevice" ADD CONSTRAINT "trustedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

