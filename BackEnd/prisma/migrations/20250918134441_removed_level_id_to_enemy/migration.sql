/*
  Warnings:

  - You are about to drop the column `level_id` on the `Enemy` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Enemy" DROP CONSTRAINT "Enemy_level_id_fkey";

-- AlterTable
ALTER TABLE "Enemy" DROP COLUMN "level_id";
