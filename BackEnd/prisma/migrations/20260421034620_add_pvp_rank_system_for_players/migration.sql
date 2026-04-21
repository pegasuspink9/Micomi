-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "player_rank_image" TEXT NOT NULL DEFAULT 'https://placehold.co/512x512/png?text=Pixel',
ADD COLUMN     "player_rank_name" TEXT NOT NULL DEFAULT 'Pixel',
ADD COLUMN     "player_rank_points" INTEGER NOT NULL DEFAULT 0;
