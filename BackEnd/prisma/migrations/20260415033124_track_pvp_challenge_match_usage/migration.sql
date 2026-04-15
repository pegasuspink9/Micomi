-- AlterTable
ALTER TABLE "PVPChallenge" ADD COLUMN     "last_used_in_match_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PVPChallenge_last_used_in_match_at_idx" ON "PVPChallenge"("last_used_in_match_at");
