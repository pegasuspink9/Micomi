/*
  Warnings:

  - Added the required column `hint` to the `Challenge` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "hint" TEXT NOT NULL;
