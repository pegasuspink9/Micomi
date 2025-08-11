/*
  Warnings:

  - You are about to drop the column `map_id` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `is_daily` on the `Quest` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_map_id_fkey";

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "map_id";

-- AlterTable
ALTER TABLE "Quest" DROP COLUMN "is_daily";
