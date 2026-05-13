-- DropIndex
DROP INDEX "Player_has_infinite_energy_energy_reset_at_idx";

-- AlterTable
ALTER TABLE "PlayerProgress" ADD COLUMN     "retry_reveal_map" JSONB DEFAULT '{}';
