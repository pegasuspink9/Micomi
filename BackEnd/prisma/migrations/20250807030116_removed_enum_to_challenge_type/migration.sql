/*
  Warnings:

  - Changed the type of `challenge_type` on the `Challenge` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Challenge" DROP COLUMN "challenge_type",
ADD COLUMN     "challenge_type" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ChallengeType";
