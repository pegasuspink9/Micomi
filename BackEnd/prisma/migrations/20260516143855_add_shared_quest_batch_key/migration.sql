-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "quest_batch_key" TEXT;

-- CreateIndex
CREATE INDEX "Quest_quest_period_quest_batch_key_idx" ON "Quest"("quest_period", "quest_batch_key");
