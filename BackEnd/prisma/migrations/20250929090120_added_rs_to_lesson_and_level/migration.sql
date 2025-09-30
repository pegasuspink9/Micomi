-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE CASCADE ON UPDATE CASCADE;
