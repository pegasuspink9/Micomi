/*
  Warnings:

  - You are about to drop the column `character_attack` on the `Character` table. All the data in the column will be lost.
  - The `character_damage` column on the `Character` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Character" DROP COLUMN "character_attack",
ADD COLUMN     "basic_attack" TEXT,
ADD COLUMN     "second_attack" TEXT,
ADD COLUMN     "special_attack" TEXT,
DROP COLUMN "character_damage",
ADD COLUMN     "character_damage" JSONB DEFAULT '[]';
