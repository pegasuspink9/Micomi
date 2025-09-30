/*
  Warnings:

  - You are about to drop the column `content` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Lesson` table. All the data in the column will be lost.
  - Added the required column `lesson_content` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lesson_description` to the `Lesson` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "content",
DROP COLUMN "description",
ADD COLUMN     "lesson_content" TEXT NOT NULL,
ADD COLUMN     "lesson_description" TEXT NOT NULL;
