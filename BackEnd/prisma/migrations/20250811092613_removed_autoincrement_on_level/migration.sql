-- AlterTable
ALTER TABLE "Lesson" ALTER COLUMN "lesson_id" DROP DEFAULT;
DROP SEQUENCE "Lesson_lesson_id_seq";

-- AlterTable
ALTER TABLE "Level" ALTER COLUMN "level_id" DROP DEFAULT;
DROP SEQUENCE "Level_level_id_seq";
