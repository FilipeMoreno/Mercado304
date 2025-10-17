-- CreateTable
CREATE TABLE "sync_jobs" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tipo" TEXT NOT NULL DEFAULT 'precos',
    "progresso" INTEGER NOT NULL DEFAULT 0,
    "mercadosProcessados" INTEGER NOT NULL DEFAULT 0,
    "produtosProcessados" INTEGER NOT NULL DEFAULT 0,
    "precosRegistrados" INTEGER NOT NULL DEFAULT 0,
    "erros" JSONB NOT NULL DEFAULT '[]',
    "logs" JSONB NOT NULL DEFAULT '[]',
    "detalhes" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_jobs_status_idx" ON "sync_jobs"("status");

-- CreateIndex
CREATE INDEX "sync_jobs_createdAt_idx" ON "sync_jobs"("createdAt");

