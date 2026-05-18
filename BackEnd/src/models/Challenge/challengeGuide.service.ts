import { prisma } from "../../../prisma/client";
import { generateChallengeGuide } from "../../../helper/aiHelper";

const DEFAULT_BATCH_SIZE = 10;

const buildGuidePayload = (challenge: {
  challenge_id: number;
  level_id: number;
  points_reward: number;
  coins_reward: number;
  challenge_type: string;
  correct_answer: unknown;
  question?: string | null;
  css_file?: string | null;
  html_file?: string | null;
  options?: unknown;
}) => ({
  challenge_id: challenge.challenge_id,
  level_id: challenge.level_id,
  points_reward: challenge.points_reward,
  coins_reward: challenge.coins_reward,
  challenge_type: challenge.challenge_type,
  correct_answer: challenge.correct_answer,
  question: challenge.question ?? null,
  css_file: challenge.css_file ?? null,
  html_file: challenge.html_file ?? null,
  options: challenge.options ?? null,
});

export const generateMissingChallengeGuides = async (): Promise<void> => {
  const batchSize = Number(process.env.CHALLENGE_GUIDE_BATCH_SIZE);
  const take =
    Number.isFinite(batchSize) && batchSize > 0
      ? batchSize
      : DEFAULT_BATCH_SIZE;

  const challenges = await prisma.challenge.findMany({
    where: {
      guide: null,
    },
    orderBy: { challenge_id: "asc" },
    take,
  });

  if (challenges.length === 0) {
    console.log("[Guide Cron] No challenges missing guides.");
    return;
  }

  console.log(
    `[Guide Cron] Generating guides for ${challenges.length} challenge(s)...`,
  );

  for (const challenge of challenges) {
    try {
      const questionText = challenge.question?.trim();
      if (!questionText) {
        console.warn(
          `[Guide Cron] Challenge ${challenge.challenge_id} has no question. Skipping.`,
        );
        continue;
      }

      const guide = await generateChallengeGuide(
        buildGuidePayload({ ...challenge, question: questionText }),
      );

      if (!guide || guide.trim().length === 0) {
        console.warn(
          `[Guide Cron] Empty guide for challenge ${challenge.challenge_id}. Skipping.`,
        );
        continue;
      }

      const updated = await prisma.challenge.updateMany({
        where: {
          challenge_id: challenge.challenge_id,
          guide: null,
        },
        data: { guide: guide.trim() },
      });

      if (updated.count === 0) {
        console.log(
          `[Guide Cron] Guide already set for challenge ${challenge.challenge_id}.`,
        );
      }
    } catch (error) {
      console.error(
        `[Guide Cron] Failed to generate guide for challenge ${challenge.challenge_id}:`,
        error,
      );
    }
  }
};
