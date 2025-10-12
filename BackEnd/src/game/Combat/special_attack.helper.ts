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
  let consecutiveWrongs = progress.consecutive_wrongs ?? 0;
  let hasReversedCurse = progress.has_reversed_curse ?? false;

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

  let newExpectedOutput = progress.player_expected_output ?? [];

  if (isCorrect && !alreadyAnsweredCorrectly && !progress.is_completed) {
    const challengeExpected = challenge.expected_output ?? [];
    newExpectedOutput = [
      ...(Array.isArray(newExpectedOutput) ? newExpectedOutput : []),
      ...(Array.isArray(challengeExpected)
        ? challengeExpected
        : [challengeExpected]),
    ];
  }

  let updateData: any = {
    player_answer: newAnswers,
    player_expected_output: newExpectedOutput,
    attempts: { increment: 1 },
  };

  if (isCorrect) {
    wrongChallenges = wrongChallenges.filter((id) => id !== challengeId);
    consecutiveCorrects += 1;
    consecutiveWrongs = 0;
    hasReversedCurse = false;

    updateData = {
      ...updateData,
      wrong_challenges: wrongChallenges,
      coins_earned: { increment: challenge.coins_reward },
      total_points_earned: { increment: challenge.points_reward },
      total_exp_points_earned: { increment: challenge.points_reward },
      consecutive_corrects: consecutiveCorrects,
      consecutive_wrongs: consecutiveWrongs,
      has_reversed_curse: hasReversedCurse,
    };
  } else {
    if (isBonusRound) {
      wrongChallenges = wrongChallenges.filter((id) => id !== challengeId);
    } else {
      if (!wrongChallenges.includes(challengeId)) {
        wrongChallenges.push(challengeId);
      }
    }
    consecutiveCorrects = 0;
    consecutiveWrongs += 1;

    const level = await prisma.level.findUnique({
      where: { level_id: progress.level_id },
      include: { map: true },
    });
    if (level) {
      const enemy = await prisma.enemy.findFirst({
        where: {
          enemy_map: level.map.map_name,
          enemy_difficulty: level.level_difficulty,
        },
      });
      if (enemy && enemy.enemy_name === "King Grimnir") {
        if (consecutiveWrongs >= 3) {
          hasReversedCurse = true;
          console.log(
            "- Reversal curse activated for King Grimnir after 3 consecutive wrongs"
          );
        }
      }
    }

    updateData = {
      ...updateData,
      wrong_challenges: wrongChallenges,
      consecutive_corrects: consecutiveCorrects,
      consecutive_wrongs: consecutiveWrongs,
      has_reversed_curse: hasReversedCurse,
    };
  }

  const updatedProgress = await prisma.playerProgress.update({
    where: { progress_id: progressId },
    data: updateData,
  });

  return {
    updatedProgress,
    alreadyAnsweredCorrectly,
  };
}
