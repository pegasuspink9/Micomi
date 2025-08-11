/*
  Warnings:

  - The `player_answer` column on the `PlayerProgress` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "PlayerProgress" DROP COLUMN "player_answer",
ADD COLUMN     "player_answer" JSONB NOT NULL DEFAULT '{}';
