-- CreateTable
CREATE TABLE "ChallengeReport" (
    "report_id" SERIAL NOT NULL,
    "level_id" INTEGER NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "report" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeReport_pkey" PRIMARY KEY ("report_id")
);

-- CreateIndex
CREATE INDEX "ChallengeReport_level_id_challenge_id_idx" ON "ChallengeReport"("level_id", "challenge_id");
