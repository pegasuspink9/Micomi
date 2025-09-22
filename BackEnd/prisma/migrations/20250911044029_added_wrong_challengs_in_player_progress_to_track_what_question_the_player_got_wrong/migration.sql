-- AlterTable
ALTER TABLE "PlayerProgress" ADD COLUMN     "wrong_challenges" JSONB NOT NULL DEFAULT '[]';
