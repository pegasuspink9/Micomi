-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "diamonds" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ThemeShop" (
    "theme_id" SERIAL NOT NULL,
    "theme_name" TEXT NOT NULL,
    "theme_color" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "ThemeShop_pkey" PRIMARY KEY ("theme_id")
);

-- CreateTable
CREATE TABLE "PlayerTheme" (
    "player_theme_id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "theme_id" INTEGER NOT NULL,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlayerTheme_pkey" PRIMARY KEY ("player_theme_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThemeShop_theme_name_key" ON "ThemeShop"("theme_name");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerTheme_player_id_theme_id_key" ON "PlayerTheme"("player_id", "theme_id");

-- AddForeignKey
ALTER TABLE "PlayerTheme" ADD CONSTRAINT "PlayerTheme_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerTheme" ADD CONSTRAINT "PlayerTheme_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "ThemeShop"("theme_id") ON DELETE CASCADE ON UPDATE CASCADE;
