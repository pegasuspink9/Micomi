/*
  Warnings:

  - Added the required column `level_difficulty` to the `Level` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `level_type` on the `Level` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `item_type` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShopItemType" AS ENUM ('character', 'potion');

-- AlterTable
ALTER TABLE "Level" ADD COLUMN     "level_difficulty" "DifficultyLevel" NOT NULL,
DROP COLUMN "level_type",
ADD COLUMN     "level_type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "item_type" "ShopItemType" NOT NULL,
ADD COLUMN     "player_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;
