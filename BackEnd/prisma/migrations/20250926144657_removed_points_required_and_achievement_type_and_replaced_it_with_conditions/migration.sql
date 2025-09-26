/*
  Warnings:

  - You are about to drop the column `achievement_type` on the `Achievement` table. All the data in the column will be lost.
  - You are about to drop the column `points_required` on the `Achievement` table. All the data in the column will be lost.
  - Added the required column `conditions` to the `Achievement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Achievement" DROP COLUMN "achievement_type",
DROP COLUMN "points_required",
ADD COLUMN     "conditions" TEXT NOT NULL;
