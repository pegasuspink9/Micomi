/*
  Warnings:

  - You are about to drop the column `enemy_level_id` on the `Level` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Level" DROP CONSTRAINT "Level_enemy_level_id_fkey";

-- AlterTable
ALTER TABLE "Level" DROP COLUMN "enemy_level_id",
ADD COLUMN     "enemy_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_enemy_id_fkey" FOREIGN KEY ("enemy_id") REFERENCES "Enemy"("enemy_id") ON DELETE CASCADE ON UPDATE CASCADE;
