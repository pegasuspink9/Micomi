/*
  Warnings:

  - A unique constraint covering the columns `[player_name]` on the table `Player` will be added. If there are existing duplicate values, this will fail.
  - Made the column `player_name` on table `Player` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Player" ALTER COLUMN "player_name" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Player_player_name_key" ON "Player"("player_name");
