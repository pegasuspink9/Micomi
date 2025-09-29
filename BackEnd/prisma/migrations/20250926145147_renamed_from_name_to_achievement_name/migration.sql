/*
  Warnings:

  - You are about to drop the column `name` on the `Achievement` table. All the data in the column will be lost.
  - Added the required column `achievement_name` to the `Achievement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Achievement" DROP COLUMN "name",
ADD COLUMN     "achievement_name" TEXT NOT NULL;
