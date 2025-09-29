/*
  Warnings:

  - You are about to drop the column `assigned_at` on the `Quest` table. All the data in the column will be lost.
  - You are about to drop the column `completed_at` on the `Quest` table. All the data in the column will be lost.
  - You are about to drop the column `current_value` on the `Quest` table. All the data in the column will be lost.
  - You are about to drop the column `is_claimed` on the `Quest` table. All the data in the column will be lost.
  - You are about to drop the column `is_completed` on the `Quest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlayerQuest" ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "current_value" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_claimed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_completed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Quest" DROP COLUMN "assigned_at",
DROP COLUMN "completed_at",
DROP COLUMN "current_value",
DROP COLUMN "is_claimed",
DROP COLUMN "is_completed";
