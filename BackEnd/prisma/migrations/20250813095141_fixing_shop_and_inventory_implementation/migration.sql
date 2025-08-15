/*
  Warnings:

  - You are about to drop the column `inventory` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the `Shop` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_character_id_fkey";

-- DropForeignKey
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_player_id_fkey";

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "inventory";

-- DropTable
DROP TABLE "Shop";

-- DropEnum
DROP TYPE "ShopItemType";

-- CreateTable
CREATE TABLE "PotionShop" (
    "potion_shop_id" SERIAL NOT NULL,
    "potion_type" "PotionType" NOT NULL,
    "potion_description" TEXT NOT NULL,
    "potion_price" INTEGER NOT NULL,

    CONSTRAINT "PotionShop_pkey" PRIMARY KEY ("potion_shop_id")
);

-- CreateTable
CREATE TABLE "PlayerPotion" (
    "player_potion_id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "potion_shop_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlayerPotion_pkey" PRIMARY KEY ("player_potion_id")
);

-- CreateTable
CREATE TABLE "CharacterShop" (
    "character_shop_id" SERIAL NOT NULL,
    "character_id" INTEGER NOT NULL,
    "character_price" INTEGER NOT NULL,

    CONSTRAINT "CharacterShop_pkey" PRIMARY KEY ("character_shop_id")
);

-- CreateTable
CREATE TABLE "PlayerCharacter" (
    "player_character_id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "character_id" INTEGER NOT NULL,
    "is_purchased" BOOLEAN NOT NULL DEFAULT false,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlayerCharacter_pkey" PRIMARY KEY ("player_character_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PotionShop_potion_type_key" ON "PotionShop"("potion_type");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerPotion_player_id_potion_shop_id_key" ON "PlayerPotion"("player_id", "potion_shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterShop_character_id_key" ON "CharacterShop"("character_id");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerCharacter_player_id_character_id_key" ON "PlayerCharacter"("player_id", "character_id");

-- AddForeignKey
ALTER TABLE "PlayerPotion" ADD CONSTRAINT "PlayerPotion_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerPotion" ADD CONSTRAINT "PlayerPotion_potion_shop_id_fkey" FOREIGN KEY ("potion_shop_id") REFERENCES "PotionShop"("potion_shop_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterShop" ADD CONSTRAINT "CharacterShop_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "Character"("character_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCharacter" ADD CONSTRAINT "PlayerCharacter_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCharacter" ADD CONSTRAINT "PlayerCharacter_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "Character"("character_id") ON DELETE CASCADE ON UPDATE CASCADE;
