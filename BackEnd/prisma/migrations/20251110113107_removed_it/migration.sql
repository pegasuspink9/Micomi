/*
  Warnings:

  - You are about to drop the column `player_level_is_unlocked` on the `PlayerProgress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlayerProgress" DROP COLUMN "player_level_is_unlocked";
