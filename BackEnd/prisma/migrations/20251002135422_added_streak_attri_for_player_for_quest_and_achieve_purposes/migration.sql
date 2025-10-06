-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "current_streak" INTEGER DEFAULT 0,
ADD COLUMN     "longest_streak" INTEGER DEFAULT 0;
