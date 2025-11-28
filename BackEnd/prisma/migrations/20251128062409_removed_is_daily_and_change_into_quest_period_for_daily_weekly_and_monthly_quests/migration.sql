/*
  Warnings:

  - You are about to drop the column `is_daily` on the `Quest` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "QuestPeriod" AS ENUM ('daily', 'weekly', 'monthly');

-- AlterTable
ALTER TABLE "PlayerQuest" ADD COLUMN     "quest_period" "QuestPeriod" DEFAULT 'daily';

-- AlterTable
ALTER TABLE "Quest" DROP COLUMN "is_daily",
ADD COLUMN     "quest_period" "QuestPeriod" DEFAULT 'daily';
