-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QuestType" ADD VALUE 'pvp_matches_total';
ALTER TYPE "QuestType" ADD VALUE 'pvp_matches_with_friends';
ALTER TYPE "QuestType" ADD VALUE 'pvp_victories';
ALTER TYPE "QuestType" ADD VALUE 'pvp_victories_with_friends';
ALTER TYPE "QuestType" ADD VALUE 'pvp_perfect_matches';
