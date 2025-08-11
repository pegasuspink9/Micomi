/*
  Warnings:

  - Added the required column `coins_reward` to the `Challenge` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "coins_reward" INTEGER NOT NULL;
