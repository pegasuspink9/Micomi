-- CreateTable
CREATE TABLE "Dialogue" (
    "dialogue_id" SERIAL NOT NULL,
    "level_id" INTEGER NOT NULL,
    "micomi_line" TEXT NOT NULL,
    "enemy_line" TEXT NOT NULL,

    CONSTRAINT "Dialogue_pkey" PRIMARY KEY ("dialogue_id")
);

-- AddForeignKey
ALTER TABLE "Dialogue" ADD CONSTRAINT "Dialogue_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE CASCADE ON UPDATE CASCADE;
