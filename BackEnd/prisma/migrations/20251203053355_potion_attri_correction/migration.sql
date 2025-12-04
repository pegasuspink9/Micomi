/*
  Warnings:

  - The values [health,strong,freeze,hint] on the enum `PotionType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `potion_name` to the `PotionShop` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PotionType_new" AS ENUM ('Life', 'Power', 'Immunity', 'Reveal');
ALTER TABLE "PotionShop" ALTER COLUMN "potion_type" TYPE "PotionType_new" USING ("potion_type"::text::"PotionType_new");
ALTER TYPE "PotionType" RENAME TO "PotionType_old";
ALTER TYPE "PotionType_new" RENAME TO "PotionType";
DROP TYPE "PotionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "PotionShop" ADD COLUMN     "potion_name" TEXT NOT NULL;
