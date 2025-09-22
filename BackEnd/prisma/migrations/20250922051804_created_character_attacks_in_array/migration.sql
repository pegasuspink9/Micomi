/*
  Warnings:

  - You are about to drop the column `basic_attack` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `second_attack` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `special_attack` on the `Character` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Character" DROP COLUMN "basic_attack",
DROP COLUMN "second_attack",
DROP COLUMN "special_attack",
ADD COLUMN     "character_attacks" JSONB DEFAULT '[]';
