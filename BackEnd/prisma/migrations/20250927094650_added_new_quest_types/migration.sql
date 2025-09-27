-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QuestType" ADD VALUE 'reach_level';
ALTER TYPE "QuestType" ADD VALUE 'use_potion';
ALTER TYPE "QuestType" ADD VALUE 'solve_challenge_no_hint';
ALTER TYPE "QuestType" ADD VALUE 'defeat_enemy_full_hp';
ALTER TYPE "QuestType" ADD VALUE 'perfect_level';
