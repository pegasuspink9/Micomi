/*
  Warnings:

  - You are about to drop the `Leaderboard` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Leaderboard" DROP CONSTRAINT "Leaderboard_player_id_fkey";

-- DropTable
DROP TABLE "Leaderboard";

-- CreateIndex
CREATE INDEX "Player_total_points_idx" ON "Player"("total_points");
