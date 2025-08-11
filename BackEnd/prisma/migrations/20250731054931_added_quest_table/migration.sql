/*
  Warnings:

  - The primary key for the `Quest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `player_mission_id` on the `Quest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quest" DROP CONSTRAINT "Quest_pkey",
DROP COLUMN "player_mission_id",
ADD COLUMN     "quest_id" SERIAL NOT NULL,
ADD CONSTRAINT "Quest_pkey" PRIMARY KEY ("quest_id");
