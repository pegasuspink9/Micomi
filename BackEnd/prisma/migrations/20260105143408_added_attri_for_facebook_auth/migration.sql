/*
  Warnings:

  - A unique constraint covering the columns `[facebook_id]` on the table `Player` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "facebook_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Player_facebook_id_key" ON "Player"("facebook_id");
