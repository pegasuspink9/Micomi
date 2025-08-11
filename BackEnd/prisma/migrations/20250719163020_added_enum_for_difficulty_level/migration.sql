/*
  Warnings:

  - Added the required column `map_image` to the `Map` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `difficulty_level` on the `Map` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('easy', 'medium', 'hard', 'expert');

-- AlterTable
ALTER TABLE "Map" ADD COLUMN     "map_image" TEXT NOT NULL,
DROP COLUMN "difficulty_level",
ADD COLUMN     "difficulty_level" "DifficultyLevel" NOT NULL;
