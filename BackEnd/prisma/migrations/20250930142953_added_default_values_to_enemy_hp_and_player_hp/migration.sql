/*
  Warnings:

  - Made the column `enemy_hp` on table `PlayerProgress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `player_hp` on table `PlayerProgress` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PlayerProgress" ALTER COLUMN "enemy_hp" SET NOT NULL,
ALTER COLUMN "enemy_hp" SET DEFAULT 0,
ALTER COLUMN "player_hp" SET NOT NULL,
ALTER COLUMN "player_hp" SET DEFAULT 0;
