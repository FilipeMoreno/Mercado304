-- CreateTable
CREATE TABLE "churrasco_calculations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adults" INTEGER NOT NULL,
    "children" INTEGER NOT NULL,
    "drinkers" INTEGER NOT NULL,
    "preferences" TEXT,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "churrasco_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "churrasco_calculations_userId_idx" ON "churrasco_calculations"("userId");

-- CreateIndex
CREATE INDEX "churrasco_calculations_createdAt_idx" ON "churrasco_calculations"("createdAt");

