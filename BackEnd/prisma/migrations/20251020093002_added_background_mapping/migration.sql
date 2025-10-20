-- CreateTable
CREATE TABLE "BackgroundMapping" (
    "id" SERIAL NOT NULL,
    "mapName" TEXT NOT NULL,
    "levelNumber" INTEGER NOT NULL,
    "backgroundUrl" TEXT NOT NULL,

    CONSTRAINT "BackgroundMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BackgroundMapping_mapName_levelNumber_key" ON "BackgroundMapping"("mapName", "levelNumber");
