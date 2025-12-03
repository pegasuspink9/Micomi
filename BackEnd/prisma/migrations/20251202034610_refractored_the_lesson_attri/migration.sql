/*
  Warnings:

  - You are about to drop the column `lesson_content` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `lesson_description` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `lesson_title` on the `Lesson` table. All the data in the column will be lost.
  - Added the required column `page_number` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `page_url` to the `Lesson` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "lesson_content",
DROP COLUMN "lesson_description",
DROP COLUMN "lesson_title",
ADD COLUMN     "page_number" INTEGER NOT NULL,
ADD COLUMN     "page_url" TEXT NOT NULL;
