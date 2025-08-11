/*
  Warnings:

  - Added the required column `character_damage` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enemy_damage` to the `Enemy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "character_damage" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Enemy" ADD COLUMN     "enemy_damage" INTEGER NOT NULL,
ALTER COLUMN "enemy_health" DROP DEFAULT;
