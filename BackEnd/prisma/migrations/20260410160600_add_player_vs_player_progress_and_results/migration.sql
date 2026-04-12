-- CreateTable
CREATE TABLE "PlayerVsPlayerProgress" (
    "progress_id" SERIAL NOT NULL,
    "match_id" TEXT NOT NULL,
    "player_one_id" INTEGER NOT NULL,
    "player_two_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerVsPlayerProgress_pkey" PRIMARY KEY ("progress_id")
);

-- CreateTable
CREATE TABLE "PlayerVsPlayerResult" (
    "result_id" SERIAL NOT NULL,
    "match_id" TEXT NOT NULL,
    "player_id" INTEGER NOT NULL,
    "player_name" TEXT NOT NULL,
    "character_name" TEXT NOT NULL,
    "character_avatar" TEXT,
    "match_status" TEXT NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerVsPlayerResult_pkey" PRIMARY KEY ("result_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerVsPlayerProgress_match_id_key" ON "PlayerVsPlayerProgress"("match_id");

-- CreateIndex
CREATE INDEX "PlayerVsPlayerProgress_player_one_id_idx" ON "PlayerVsPlayerProgress"("player_one_id");

-- CreateIndex
CREATE INDEX "PlayerVsPlayerProgress_player_two_id_idx" ON "PlayerVsPlayerProgress"("player_two_id");

-- CreateIndex
CREATE INDEX "PlayerVsPlayerProgress_status_idx" ON "PlayerVsPlayerProgress"("status");

-- CreateIndex
CREATE INDEX "PlayerVsPlayerResult_player_id_idx" ON "PlayerVsPlayerResult"("player_id");

-- CreateIndex
CREATE INDEX "PlayerVsPlayerResult_match_status_idx" ON "PlayerVsPlayerResult"("match_status");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerVsPlayerResult_match_id_player_id_key" ON "PlayerVsPlayerResult"("match_id", "player_id");

-- AddForeignKey
ALTER TABLE "PlayerVsPlayerProgress" ADD CONSTRAINT "PlayerVsPlayerProgress_player_one_id_fkey" FOREIGN KEY ("player_one_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerVsPlayerProgress" ADD CONSTRAINT "PlayerVsPlayerProgress_player_two_id_fkey" FOREIGN KEY ("player_two_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerVsPlayerResult" ADD CONSTRAINT "PlayerVsPlayerResult_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;
