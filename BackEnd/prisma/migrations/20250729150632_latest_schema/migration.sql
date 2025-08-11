/*
  Warnings:

  - You are about to drop the column `potion_health_boost` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `potion_quantity` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `potion_total_cost` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `potion_type` on the `Player` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[map_name]` on the table `Map` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `Player` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `character_price` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Challenge" DROP CONSTRAINT "Challenge_level_id_fkey";

-- DropForeignKey
ALTER TABLE "Character" DROP CONSTRAINT "Character_player_id_fkey";

-- DropForeignKey
ALTER TABLE "Enemy" DROP CONSTRAINT "Enemy_level_id_fkey";

-- DropForeignKey
ALTER TABLE "Leaderboard" DROP CONSTRAINT "Leaderboard_player_id_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_level_id_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_map_id_fkey";

-- DropForeignKey
ALTER TABLE "Level" DROP CONSTRAINT "Level_map_id_fkey";

-- DropForeignKey
ALTER TABLE "Map" DROP CONSTRAINT "Map_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "PlayerProgress" DROP CONSTRAINT "PlayerProgress_level_id_fkey";

-- DropForeignKey
ALTER TABLE "PlayerProgress" DROP CONSTRAINT "PlayerProgress_player_id_fkey";

-- AlterTable
ALTER TABLE "Achievement" ALTER COLUMN "points_required" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Challenge" ALTER COLUMN "points_reward" SET DEFAULT 0,
ALTER COLUMN "coins_reward" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Character" ALTER COLUMN "health" SET DEFAULT 100;

-- AlterTable
ALTER TABLE "Enemy" ALTER COLUMN "enemy_health" SET DEFAULT 100;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "is_unlocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Level" ALTER COLUMN "points_reward" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "potion_health_boost",
DROP COLUMN "potion_quantity",
DROP COLUMN "potion_total_cost",
DROP COLUMN "potion_type",
ADD COLUMN     "exp_points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "inventory" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "PlayerProgress" ALTER COLUMN "score" SET DEFAULT 0,
ALTER COLUMN "attempts" SET DEFAULT 0,
ALTER COLUMN "player_answer" SET DEFAULT '';

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "character_id" INTEGER,
ADD COLUMN     "character_price" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Mission" (
    "player_mission_id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "level_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("player_mission_id")
);

-- CreateIndex
CREATE INDEX "Mission_player_id_level_id_idx" ON "Mission"("player_id", "level_id");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_player_id_level_id_key" ON "Mission"("player_id", "level_id");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Map_map_name_key" ON "Map"("map_name");

-- CreateIndex
CREATE UNIQUE INDEX "Player_username_key" ON "Player"("username");

-- AddForeignKey
ALTER TABLE "Map" ADD CONSTRAINT "Map_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "Admin"("admin_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "Map"("map_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "Map"("map_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enemy" ADD CONSTRAINT "Enemy_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerProgress" ADD CONSTRAINT "PlayerProgress_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerProgress" ADD CONSTRAINT "PlayerProgress_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "Character"("character_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE CASCADE ON UPDATE CASCADE;
