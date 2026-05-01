-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "guide" TEXT,
ADD COLUMN     "options" JSONB DEFAULT '[]';
