/*
  Warnings:

  - You are about to drop the column `player_id` on the `Character` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Character" DROP CONSTRAINT "Character_player_id_fkey";

-- AlterTable
ALTER TABLE "Character" DROP COLUMN "player_id";
