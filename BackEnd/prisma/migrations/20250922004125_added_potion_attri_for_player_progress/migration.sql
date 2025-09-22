-- AlterTable
ALTER TABLE "PlayerProgress" ADD COLUMN     "has_freeze_effect" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_strong_effect" BOOLEAN NOT NULL DEFAULT false;
