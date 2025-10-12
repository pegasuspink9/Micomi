-- AlterTable
ALTER TABLE "PlayerProgress" ADD COLUMN     "consecutive_wrongs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "has_reversed_curse" BOOLEAN NOT NULL DEFAULT false;
