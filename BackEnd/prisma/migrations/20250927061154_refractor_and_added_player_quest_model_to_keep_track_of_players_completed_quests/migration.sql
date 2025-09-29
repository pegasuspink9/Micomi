/*
  Warnings:

  - You are about to drop the column `is_template` on the `Quest` table. All the data in the column will be lost.
  - You are about to drop the column `level_id` on the `Quest` table. All the data in the column will be lost.
  - You are about to drop the column `player_id` on the `Quest` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Quest" DROP CONSTRAINT "Quest_level_id_fkey";

-- DropForeignKey
ALTER TABLE "Quest" DROP CONSTRAINT "Quest_player_id_fkey";

-- AlterTable
ALTER TABLE "Quest" DROP COLUMN "is_template",
DROP COLUMN "level_id",
DROP COLUMN "player_id",
ADD COLUMN     "is_claimed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PlayerQuest" (
    "player_quest_id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "quest_id" INTEGER NOT NULL,

    CONSTRAINT "PlayerQuest_pkey" PRIMARY KEY ("player_quest_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerQuest_player_id_quest_id_key" ON "PlayerQuest"("player_id", "quest_id");

-- AddForeignKey
ALTER TABLE "PlayerQuest" ADD CONSTRAINT "PlayerQuest_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerQuest" ADD CONSTRAINT "PlayerQuest_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "Quest"("quest_id") ON DELETE CASCADE ON UPDATE CASCADE;
