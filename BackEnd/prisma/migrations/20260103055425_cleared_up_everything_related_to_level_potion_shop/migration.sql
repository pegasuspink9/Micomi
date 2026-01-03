/*
  Warnings:

  - You are about to drop the column `done_shop_level` on the `PlayerProgress` table. All the data in the column will be lost.
  - You are about to drop the `PlayerLevelPotion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PotionShopByLevel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PlayerLevelPotion" DROP CONSTRAINT "PlayerLevelPotion_level_id_fkey";

-- DropForeignKey
ALTER TABLE "PlayerLevelPotion" DROP CONSTRAINT "PlayerLevelPotion_player_id_fkey";

-- DropForeignKey
ALTER TABLE "PlayerLevelPotion" DROP CONSTRAINT "PlayerLevelPotion_potion_shop_id_fkey";

-- DropForeignKey
ALTER TABLE "PotionShopByLevel" DROP CONSTRAINT "PotionShopByLevel_level_id_fkey";

-- AlterTable
ALTER TABLE "PlayerProgress" DROP COLUMN "done_shop_level";

-- DropTable
DROP TABLE "PlayerLevelPotion";

-- DropTable
DROP TABLE "PotionShopByLevel";
