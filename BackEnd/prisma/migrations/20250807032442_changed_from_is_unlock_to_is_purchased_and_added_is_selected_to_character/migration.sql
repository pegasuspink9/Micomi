/*
  Warnings:

  - You are about to drop the column `is_unlock` on the `Character` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Character" DROP COLUMN "is_unlock",
ADD COLUMN     "is_purchased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_selected" BOOLEAN NOT NULL DEFAULT false;
