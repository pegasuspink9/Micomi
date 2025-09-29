-- AlterTable
ALTER TABLE "Level" ADD COLUMN     "enemy_level_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_enemy_level_id_fkey" FOREIGN KEY ("enemy_level_id") REFERENCES "Enemy"("enemy_id") ON DELETE CASCADE ON UPDATE CASCADE;
