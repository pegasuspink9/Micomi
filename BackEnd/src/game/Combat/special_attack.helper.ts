import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function updateProgressForChallenge(
  progressId: number,
  challengeId: number,
  isCorrect: boolean,
  finalAnswer: string[],
  isBonusRound: boolean = false
) {
  const progress = await prisma.playerProgress.findUnique({
    where: { progress_id: progressId },
  });
  if (!progress) throw new Error("Progress not found");

  let consecutiveCorrects = progress.consecutive_corrects ?? 0;

  const challenge = await prisma.challenge.findUnique({
    where: { challenge_id: challengeId },
  });
  if (!challenge) throw new Error("Challenge not found");

  const existingAnswers = (progress.player_answer ?? {}) as Record<
    string,
    string[]
  >;

  const alreadyAnsweredCorrectly =
    !!existingAnswers[challengeId.toString()] &&
    (progress.wrong_challenges as number[]).includes(challengeId) === false;

  const newAnswers = {
    ...existingAnswers,
    [challengeId.toString()]: finalAnswer,
  };

  let wrongChallenges = (progress.wrong_challenges ?? []) as number[];

  if (isCorrect) {
    wrongChallenges = wrongChallenges.filter((id) => id !== challengeId);
    consecutiveCorrects += 1;

    await prisma.playerProgress.update({
      where: { progress_id: progressId },
      data: {
        wrong_challenges: wrongChallenges,
        coins_earned: { increment: challenge.coins_reward },
      },
    });
  } else {
    if (isBonusRound) {
      wrongChallenges = wrongChallenges.filter((id) => id !== challengeId);
    } else {
      if (!wrongChallenges.includes(challengeId)) {
        wrongChallenges.push(challengeId);
      }
    }
    consecutiveCorrects = 0;
  }

  const updatedProgress = await prisma.playerProgress.update({
    where: { progress_id: progressId },
    data: {
      player_answer: newAnswers,
      wrong_challenges: wrongChallenges,
      attempts: { increment: 1 },
      consecutive_corrects: consecutiveCorrects,
    },
  });

  return {
    updatedProgress,
    alreadyAnsweredCorrectly,
  };
}
