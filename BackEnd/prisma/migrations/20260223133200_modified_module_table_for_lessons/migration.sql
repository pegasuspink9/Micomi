/*
  Warnings:

  - You are about to drop the column `module_title` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the `ModuleContent` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `lesson_content` to the `Module` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level_id` to the `Module` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ModuleContent" DROP CONSTRAINT "ModuleContent_module_id_fkey";

-- AlterTable
ALTER TABLE "Module" DROP COLUMN "module_title",
ADD COLUMN     "lesson_content" TEXT NOT NULL,
ADD COLUMN     "level_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "ModuleContent";

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE CASCADE ON UPDATE CASCADE;
