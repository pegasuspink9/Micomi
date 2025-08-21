/*
  Warnings:

  - A unique constraint covering the columns `[player_id]` on the table `Leaderboard` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[player_id,achievement_id]` on the table `PlayerAchievement` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_player_id_key" ON "Leaderboard"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerAchievement_player_id_achievement_id_key" ON "PlayerAchievement"("player_id", "achievement_id");
