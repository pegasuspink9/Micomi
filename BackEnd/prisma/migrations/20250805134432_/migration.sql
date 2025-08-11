-- AlterTable
ALTER TABLE "Shop" ALTER COLUMN "potion_description" DROP NOT NULL,
ALTER COLUMN "potion_price" DROP NOT NULL,
ALTER COLUMN "potion_health_boost" DROP NOT NULL,
ALTER COLUMN "potion_type" DROP NOT NULL,
ALTER COLUMN "character_price" DROP NOT NULL;
