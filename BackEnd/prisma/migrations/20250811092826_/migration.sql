-- AlterTable
CREATE SEQUENCE lesson_lesson_id_seq;
ALTER TABLE "Lesson" ALTER COLUMN "lesson_id" SET DEFAULT nextval('lesson_lesson_id_seq');
ALTER SEQUENCE lesson_lesson_id_seq OWNED BY "Lesson"."lesson_id";

-- AlterTable
CREATE SEQUENCE level_level_id_seq;
ALTER TABLE "Level" ALTER COLUMN "level_id" SET DEFAULT nextval('level_level_id_seq');
ALTER SEQUENCE level_level_id_seq OWNED BY "Level"."level_id";
