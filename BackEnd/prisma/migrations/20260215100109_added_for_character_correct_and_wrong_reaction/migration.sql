-- AlterTable
ALTER TABLE "PlayerProgress" ADD COLUMN     "used_char_correct_reactions" JSONB DEFAULT '[]',
ADD COLUMN     "used_char_wrong_reactions" JSONB DEFAULT '[]';
