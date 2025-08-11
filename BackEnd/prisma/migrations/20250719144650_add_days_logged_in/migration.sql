/*
  Warnings:

  - You are about to drop the column `days_loggedin` on the `Player` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Admin" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "days_loggedin",
ADD COLUMN     "days_logged_in" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "last_active" DROP NOT NULL;
