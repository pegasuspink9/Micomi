-- AlterTable
ALTER TABLE "PlayerProgress" ADD COLUMN     "total_exp_points_earned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_points_earned" INTEGER NOT NULL DEFAULT 0;
