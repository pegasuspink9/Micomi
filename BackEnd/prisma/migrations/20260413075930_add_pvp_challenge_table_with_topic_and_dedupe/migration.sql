-- CreateTable
CREATE TABLE "PVPChallenge" (
    "pvp_challenge_id" SERIAL NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'Easy',
    "points_reward" INTEGER NOT NULL DEFAULT 0,
    "coins_reward" INTEGER NOT NULL DEFAULT 0,
    "correct_answer" JSONB NOT NULL DEFAULT '[]',
    "options" JSONB DEFAULT '[]',
    "question" TEXT,
    "css_file" TEXT,
    "html_file" TEXT,
    "dedupe_signature" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PVPChallenge_pkey" PRIMARY KEY ("pvp_challenge_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PVPChallenge_dedupe_signature_key" ON "PVPChallenge"("dedupe_signature");

-- CreateIndex
CREATE INDEX "PVPChallenge_topic_difficulty_idx" ON "PVPChallenge"("topic", "difficulty");

-- CreateIndex
CREATE INDEX "PVPChallenge_created_at_idx" ON "PVPChallenge"("created_at");
