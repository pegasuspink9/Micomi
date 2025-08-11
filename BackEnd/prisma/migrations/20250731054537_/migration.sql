/*
  Warnings:

  - You are about to drop the `Mission` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('defeat_enemy', 'buy_potion', 'unlock_character', 'complete_lesson', 'solve_challenge', 'spend_coins', 'earn_exp', 'login_days');

-- DropForeignKey
ALTER TABLE "Mission" DROP CONSTRAINT "Mission_level_id_fkey";

-- DropForeignKey
ALTER TABLE "Mission" DROP CONSTRAINT "Mission_player_id_fkey";

-- DropTable
DROP TABLE "Mission";

-- CreateTable
CREATE TABLE "Quest" (
    "player_mission_id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "level_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objective_type" "QuestType" NOT NULL,
    "target_value" INTEGER NOT NULL,
    "current_value" INTEGER NOT NULL DEFAULT 0,
    "reward_exp" INTEGER NOT NULL DEFAULT 0,
    "reward_coins" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_daily" BOOLEAN NOT NULL DEFAULT false,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("player_mission_id")
);

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;
