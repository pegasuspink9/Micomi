/*
  Warnings:

  - You are about to drop the `Follow` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FriendRequestStatus" AS ENUM ('pending', 'accepted', 'declined');

-- DropForeignKey
ALTER TABLE "Follow" DROP CONSTRAINT "Follow_follower_id_fkey";

-- DropForeignKey
ALTER TABLE "Follow" DROP CONSTRAINT "Follow_following_id_fkey";

-- DropTable
DROP TABLE "Follow";

-- CreateTable
CREATE TABLE "FriendRequest" (
    "friend_request_id" SERIAL NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "status" "FriendRequestStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("friend_request_id")
);

-- CreateTable
CREATE TABLE "Friend" (
    "friend_id" SERIAL NOT NULL,
    "player_one_id" INTEGER NOT NULL,
    "player_two_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("friend_id")
);

-- CreateIndex
CREATE INDEX "FriendRequest_sender_id_status_idx" ON "FriendRequest"("sender_id", "status");

-- CreateIndex
CREATE INDEX "FriendRequest_receiver_id_status_idx" ON "FriendRequest"("receiver_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_sender_id_receiver_id_key" ON "FriendRequest"("sender_id", "receiver_id");

-- CreateIndex
CREATE INDEX "Friend_player_one_id_idx" ON "Friend"("player_one_id");

-- CreateIndex
CREATE INDEX "Friend_player_two_id_idx" ON "Friend"("player_two_id");

-- CreateIndex
CREATE UNIQUE INDEX "Friend_player_one_id_player_two_id_key" ON "Friend"("player_one_id", "player_two_id");

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_player_one_id_fkey" FOREIGN KEY ("player_one_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_player_two_id_fkey" FOREIGN KEY ("player_two_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;
