/*
  Warnings:

  - Added the required column `description` to the `Character` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "description" TEXT NOT NULL;
