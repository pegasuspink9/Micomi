/*
  Warnings:

  - You are about to drop the column `used_enemy_reactions` on the `PlayerProgress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlayerProgress" DROP COLUMN "used_enemy_reactions",
ADD COLUMN     "used_enemy_correct_reactions" JSONB DEFAULT '[]',
ADD COLUMN     "used_enemy_wrong_reactions" JSONB DEFAULT '[]';
