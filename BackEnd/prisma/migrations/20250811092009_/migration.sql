/*
  Warnings:

  - You are about to drop the column `admin_id` on the `Map` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_level_id_fkey";

-- DropForeignKey
ALTER TABLE "Map" DROP CONSTRAINT "Map_admin_id_fkey";

-- AlterTable
ALTER TABLE "Map" DROP COLUMN "admin_id";
