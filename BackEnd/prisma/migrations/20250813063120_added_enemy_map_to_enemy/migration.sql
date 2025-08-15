/*
  Warnings:

  - Added the required column `enemy_map` to the `Enemy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Enemy" ADD COLUMN     "enemy_map" TEXT NOT NULL;
