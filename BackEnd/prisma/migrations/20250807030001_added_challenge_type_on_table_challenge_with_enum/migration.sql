/*
  Warnings:

  - Added the required column `challenge_type` to the `Challenge` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('multiple_choice', 'fill_in_the_blank', 'typing_code');

-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "challenge_type" "ChallengeType" NOT NULL;
