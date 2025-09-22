/*
  Warnings:

  - The `correct_answer` column on the `Challenge` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Challenge" DROP COLUMN "correct_answer",
ADD COLUMN     "correct_answer" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "PlayerProgress" ALTER COLUMN "player_answer" SET DEFAULT '[]';
