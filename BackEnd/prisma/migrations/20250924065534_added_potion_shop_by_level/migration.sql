-- CreateTable
CREATE TABLE "PotionShopByLevel" (
    "potion_shop_by_level_id" SERIAL NOT NULL,
    "level_id" INTEGER NOT NULL,
    "potions_avail" JSONB NOT NULL DEFAULT '[]',
    "health_quantity" INTEGER NOT NULL DEFAULT 0,
    "strong_quantity" INTEGER NOT NULL DEFAULT 0,
    "freeze_quantity" INTEGER NOT NULL DEFAULT 0,
    "hint_quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PotionShopByLevel_pkey" PRIMARY KEY ("potion_shop_by_level_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PotionShopByLevel_level_id_key" ON "PotionShopByLevel"("level_id");

-- AddForeignKey
ALTER TABLE "PotionShopByLevel" ADD CONSTRAINT "PotionShopByLevel_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE CASCADE ON UPDATE CASCADE;
