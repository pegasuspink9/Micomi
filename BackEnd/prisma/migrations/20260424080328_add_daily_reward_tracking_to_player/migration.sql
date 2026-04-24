-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "daily_reward_day" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "daily_reward_last_claimed_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Player_daily_reward_last_claimed_at_idx" ON "Player"("daily_reward_last_claimed_at");
