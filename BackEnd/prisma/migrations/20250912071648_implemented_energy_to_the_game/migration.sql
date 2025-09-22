-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "energy" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "energy_reset_at" TIMESTAMP(3);
