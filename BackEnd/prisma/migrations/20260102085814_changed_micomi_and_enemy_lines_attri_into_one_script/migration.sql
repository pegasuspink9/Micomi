/*
  Warnings:

  - You are about to drop the column `enemy_line` on the `Dialogue` table. All the data in the column will be lost.
  - You are about to drop the column `micomi_line` on the `Dialogue` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Dialogue" DROP COLUMN "enemy_line",
DROP COLUMN "micomi_line",
ADD COLUMN     "script" TEXT;
