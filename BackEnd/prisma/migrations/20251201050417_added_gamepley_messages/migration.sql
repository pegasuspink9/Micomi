-- CreateEnum
CREATE TYPE "MessageCategory" AS ENUM ('CORRECT_BASE', 'CORRECT_STREAK', 'CORRECT_QUICK', 'CORRECT_HINT', 'CORRECT_FINAL', 'CORRECT_LOW_HEALTH', 'CORRECT_BONUS', 'WRONG_BASE', 'WRONG_LOW_HEALTH', 'WRONG_LOST', 'WRONG_BONUS');

-- CreateEnum
CREATE TYPE "MessageTag" AS ENUM ('quick', 'hint', 'streak', 'final_blow', 'low_health', 'bonus', 'lost');

-- CreateTable
CREATE TABLE "GameplayMessage" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "textTemplate" TEXT NOT NULL,
    "audioUrl" TEXT,
    "category" "MessageCategory" NOT NULL,
    "tags" "MessageTag"[] DEFAULT ARRAY[]::"MessageTag"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameplayMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameplayMessage_key_key" ON "GameplayMessage"("key");

-- CreateIndex
CREATE INDEX "GameplayMessage_category_idx" ON "GameplayMessage"("category");

-- CreateIndex
CREATE INDEX "GameplayMessage_category_tags_idx" ON "GameplayMessage"("category", "tags");
