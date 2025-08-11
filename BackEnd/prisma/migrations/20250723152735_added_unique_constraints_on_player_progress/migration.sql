/*
  Warnings:

  - A unique constraint covering the columns `[player_id,level_id]` on the table `PlayerProgress` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PlayerProgress_player_id_level_id_key" ON "PlayerProgress"("player_id", "level_id");
