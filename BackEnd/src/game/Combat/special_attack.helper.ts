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
  const alreadyAnsweredCorrectly = !!existingAnswers[challengeId.toString()];

  const newAnswers = { ...existingAnswers };
  let wrongChallenges = (progress.wrong_challenges ?? []) as number[];

  if (isCorrect && !alreadyAnsweredCorrectly) {
    newAnswers[challengeId.toString()] = finalAnswer;
    wrongChallenges = wrongChallenges.filter((id) => id !== challengeId);
  } else if (!isCorrect && !wrongChallenges.includes(challengeId)) {
    wrongChallenges.push(challengeId);
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
