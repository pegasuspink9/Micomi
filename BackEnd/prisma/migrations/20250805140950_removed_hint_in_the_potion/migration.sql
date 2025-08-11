/*
  Warnings:

  - The values [hint] on the enum `PotionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PotionType_new" AS ENUM ('health', 'strong', 'freeze');
ALTER TABLE "Shop" ALTER COLUMN "potion_type" TYPE "PotionType_new" USING ("potion_type"::text::"PotionType_new");
ALTER TYPE "PotionType" RENAME TO "PotionType_old";
ALTER TYPE "PotionType_new" RENAME TO "PotionType";
DROP TYPE "PotionType_old";
COMMIT;
