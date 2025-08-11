/*
  Warnings:

  - You are about to drop the column `potion_name` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `potion_name` on the `Shop` table. All the data in the column will be lost.
  - Added the required column `potion_type` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PotionType" AS ENUM ('health', 'hint', 'strong', 'freeze');

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "potion_name",
ADD COLUMN     "potion_type" "PotionType";

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "potion_name",
ADD COLUMN     "potion_type" "PotionType" NOT NULL;
