/*
  Warnings:

  - A unique constraint covering the columns `[google_id]` on the table `Player` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "google_id" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Player_google_id_key" ON "Player"("google_id");
