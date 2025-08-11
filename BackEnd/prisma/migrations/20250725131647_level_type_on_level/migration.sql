/*
  Warnings:

  - You are about to drop the column `difficulty` on the `Level` table. All the data in the column will be lost.
  - Changed the type of `level_type` on the `Level` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Level" DROP COLUMN "difficulty",
DROP COLUMN "level_type",
ADD COLUMN     "level_type" "DifficultyLevel" NOT NULL;
