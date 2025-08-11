/*
  Warnings:

  - The primary key for the `Quest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `quest_id` on the `Quest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quest" DROP CONSTRAINT "Quest_pkey",
DROP COLUMN "quest_id",
ADD COLUMN     "player_mission_id" SERIAL NOT NULL,
ADD CONSTRAINT "Quest_pkey" PRIMARY KEY ("player_mission_id");

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE SET NULL ON UPDATE CASCADE;
