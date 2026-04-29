/*
  Warnings:

  - The `character_run` column on the `Character` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Character" DROP COLUMN "character_run",
ADD COLUMN     "character_run" JSONB;
