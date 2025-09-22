-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "options" JSONB DEFAULT '[]';

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "character_attack" TEXT,
ADD COLUMN     "character_dies" TEXT,
ADD COLUMN     "character_hurt" TEXT,
ADD COLUMN     "user_coins" INTEGER DEFAULT 0,
ALTER COLUMN "avatar_image" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Enemy" ADD COLUMN     "enemy_attack" TEXT,
ADD COLUMN     "enemy_coins" INTEGER DEFAULT 0,
ADD COLUMN     "enemy_dies" TEXT;
