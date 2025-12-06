/*
  Warnings:

  - You are about to drop the column `has_purmuted_ss` on the `PlayerProgress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlayerProgress" DROP COLUMN "has_purmuted_ss",
ADD COLUMN     "has_permuted_ss" BOOLEAN DEFAULT false;
