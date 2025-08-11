-- CreateTable
CREATE TABLE "Lesson" (
    "lesson_id" SERIAL NOT NULL,
    "map_id" INTEGER NOT NULL,
    "level_id" INTEGER NOT NULL,
    "lesson_title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("lesson_id")
);

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "Map"("map_id") ON DELETE RESTRICT ON UPDATE CASCADE;
