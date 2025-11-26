/*
  Warnings:

  - Made the column `level_number` on table `Level` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Level" ALTER COLUMN "level_number" SET NOT NULL;
