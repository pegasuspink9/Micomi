/*
  Warnings:

  - You are about to drop the column `guide` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `options` on the `Challenge` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Challenge" DROP COLUMN "guide",
DROP COLUMN "options";
