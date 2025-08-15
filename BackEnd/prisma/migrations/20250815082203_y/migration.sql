/*
  Warnings:

  - Added the required column `challenge_start_time` to the `PlayerProgress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlayerProgress" ADD COLUMN     "challenge_start_time" TIMESTAMP(3) NOT NULL;
