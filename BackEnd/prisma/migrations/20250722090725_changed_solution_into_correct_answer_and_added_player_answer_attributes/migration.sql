/*
  Warnings:

  - You are about to drop the column `solution` on the `Challenge` table. All the data in the column will be lost.
  - Added the required column `correct_answer` to the `Challenge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player_answer` to the `PlayerProgress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Challenge" DROP COLUMN "solution",
ADD COLUMN     "correct_answer" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PlayerProgress" ADD COLUMN     "player_answer" TEXT NOT NULL;
