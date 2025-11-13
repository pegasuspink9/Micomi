/*
  Warnings:

  - You are about to drop the column `file_name` on the `Challenge` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Challenge" DROP COLUMN "file_name",
ADD COLUMN     "computer_file" TEXT,
ADD COLUMN     "computer_file_name" TEXT,
ADD COLUMN     "css_file" TEXT,
ADD COLUMN     "css_file_name" TEXT,
ADD COLUMN     "html_file" TEXT,
ADD COLUMN     "html_file_name" TEXT,
ADD COLUMN     "javascript_file" TEXT,
ADD COLUMN     "javascript_file_name" TEXT;
