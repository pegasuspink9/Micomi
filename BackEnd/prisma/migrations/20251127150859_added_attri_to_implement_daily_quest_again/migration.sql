-- AlterTable
ALTER TABLE "PlayerQuest" ADD COLUMN     "expires_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "is_daily" BOOLEAN DEFAULT false;
