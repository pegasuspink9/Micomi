/*
  Warnings:

  - Made the column `is_completed` on table `PlayerProgress` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PlayerProgress" ALTER COLUMN "is_completed" SET NOT NULL;
