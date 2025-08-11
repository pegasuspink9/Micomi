/*
  Warnings:

  - You are about to drop the column `exp_points` on the `Character` table. All the data in the column will be lost.
  - Added the required column `health` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enemy_health` to the `Enemy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Character" DROP COLUMN "exp_points",
ADD COLUMN     "health" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Enemy" ADD COLUMN     "enemy_health" INTEGER NOT NULL;
