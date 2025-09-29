import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function updateProgressForChallenge(
  progressId: number,
  challengeId: number,
  isCorrect: boolean,
  finalAnswer: string[]
) {
  const progress = await prisma.playerProgress.findUnique({
    where: { progress_id: progressId },
  });
  if (!progress) throw new Error("Progress not found");

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
  } else {
    if (!wrongChallenges.includes(challengeId)) {
      wrongChallenges.push(challengeId);
    }
  }

  const updatedProgress = await prisma.playerProgress.update({
    where: { progress_id: progressId },
    data: {
      player_answer: newAnswers,
      wrong_challenges: wrongChallenges,
      attempts: { increment: 1 },
    },
  });

  return {
    updatedProgress,
    alreadyAnsweredCorrectly,
  };
}
