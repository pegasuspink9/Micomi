/*
  Warnings:

  - You are about to drop the column `computer_file` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `computer_file_name` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `css_file_name` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `expected_output` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `hint` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `html_file_name` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `javascript_file` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `javascript_file_name` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `test_cases` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Challenge` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Challenge" DROP COLUMN "computer_file",
DROP COLUMN "computer_file_name",
DROP COLUMN "css_file_name",
DROP COLUMN "description",
DROP COLUMN "expected_output",
DROP COLUMN "hint",
DROP COLUMN "html_file_name",
DROP COLUMN "javascript_file",
DROP COLUMN "javascript_file_name",
DROP COLUMN "test_cases",
DROP COLUMN "title";
