-- AlterTable
ALTER TABLE "PlayerProgress" ALTER COLUMN "is_completed" DROP NOT NULL,
ALTER COLUMN "is_completed" SET DEFAULT false;
