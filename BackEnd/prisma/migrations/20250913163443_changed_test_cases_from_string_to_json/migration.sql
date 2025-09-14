/*
  Warnings:

  - The `test_cases` column on the `Challenge` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Challenge" DROP COLUMN "test_cases",
ADD COLUMN     "test_cases" JSONB DEFAULT '[]';
