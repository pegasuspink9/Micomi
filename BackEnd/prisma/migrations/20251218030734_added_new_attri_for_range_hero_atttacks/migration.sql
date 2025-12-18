/*
  Warnings:

  - You are about to drop the column `attack_pose` on the `Character` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Character" DROP COLUMN "attack_pose",
ADD COLUMN     "range_attacks" JSONB DEFAULT '[]';
