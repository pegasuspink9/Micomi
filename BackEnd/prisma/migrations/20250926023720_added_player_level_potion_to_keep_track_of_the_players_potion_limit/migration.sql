-- CreateTable
CREATE TABLE "PlayerLevelPotion" (
    "player_level_potion_id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "level_id" INTEGER NOT NULL,
    "potion_shop_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerLevelPotion_pkey" PRIMARY KEY ("player_level_potion_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerLevelPotion_player_id_level_id_potion_shop_id_key" ON "PlayerLevelPotion"("player_id", "level_id", "potion_shop_id");

-- AddForeignKey
ALTER TABLE "PlayerLevelPotion" ADD CONSTRAINT "PlayerLevelPotion_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerLevelPotion" ADD CONSTRAINT "PlayerLevelPotion_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerLevelPotion" ADD CONSTRAINT "PlayerLevelPotion_potion_shop_id_fkey" FOREIGN KEY ("potion_shop_id") REFERENCES "PotionShop"("potion_shop_id") ON DELETE CASCADE ON UPDATE CASCADE;
