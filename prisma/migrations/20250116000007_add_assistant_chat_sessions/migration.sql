-- CreateTable
CREATE TABLE "assistant_chat_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assistant_chat_sessions_userId_idx" ON "assistant_chat_sessions"("userId");

-- CreateIndex
CREATE INDEX "assistant_chat_sessions_createdAt_idx" ON "assistant_chat_sessions"("createdAt");

-- CreateIndex
CREATE INDEX "assistant_chat_sessions_updatedAt_idx" ON "assistant_chat_sessions"("updatedAt");
