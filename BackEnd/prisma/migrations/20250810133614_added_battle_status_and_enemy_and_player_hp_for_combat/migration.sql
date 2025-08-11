-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('in_progress', 'won', 'lost');

-- AlterTable
ALTER TABLE "PlayerProgress" ADD COLUMN     "battle_status" "BattleStatus" DEFAULT 'in_progress',
ADD COLUMN     "enemy_hp" INTEGER,
ADD COLUMN     "player_hp" INTEGER;
