/*
  Warnings:

  - Made the column `current_streak` on table `Player` required. This step will fail if there are existing NULL values in that column.
  - Made the column `longest_streak` on table `Player` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Player" ALTER COLUMN "current_streak" SET NOT NULL,
ALTER COLUMN "longest_streak" SET NOT NULL;
