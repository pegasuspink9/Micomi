-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "coins" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "health" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "potion_health_boost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "potion_name" TEXT,
ADD COLUMN     "potion_quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "potion_total_cost" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Shop" (
    "shop_id" SERIAL NOT NULL,
    "potion_name" TEXT NOT NULL,
    "potion_description" TEXT NOT NULL,
    "potion_price" INTEGER NOT NULL,
    "potion_health_boost" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("shop_id")
);
