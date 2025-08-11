/*
  Warnings:

  - Changed the type of `difficulty` on the `Challenge` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `difficulty` to the `Level` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level_type` to the `Level` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Challenge" DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" "DifficultyLevel" NOT NULL;

-- AlterTable
ALTER TABLE "Level" ADD COLUMN     "difficulty" "DifficultyLevel" NOT NULL,
ADD COLUMN     "level_type" TEXT NOT NULL;
