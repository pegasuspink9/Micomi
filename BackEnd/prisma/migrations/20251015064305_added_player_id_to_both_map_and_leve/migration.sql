-- AlterTable
ALTER TABLE "Level" ADD COLUMN     "player_id" INTEGER;

-- AlterTable
ALTER TABLE "Map" ADD COLUMN     "player_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Map" ADD CONSTRAINT "Map_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE SET NULL ON UPDATE CASCADE;
