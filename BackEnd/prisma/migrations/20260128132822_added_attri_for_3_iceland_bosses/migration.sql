-- AlterTable
ALTER TABLE "PlayerProgress" ADD COLUMN     "has_dollar_sign_ss" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_only_blanks_ss" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_reverse_words_ss" BOOLEAN NOT NULL DEFAULT false;
