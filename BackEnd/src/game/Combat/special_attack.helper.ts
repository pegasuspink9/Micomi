import { PrismaClient } from "@prisma/client";
import { success } from "zod";
const prisma = new PrismaClient();

export async function updateProgressForChallenge(
  progressId: number,
  challengeId: number,
  isCorrect: boolean,
  finalAnswer: string[],
  isBonusRound: boolean = false,
  characterDamage?: number
) {
  const progress = await prisma.playerProgress.findUnique({
    where: { progress_id: progressId },
  });
  if (!progress) return { message: "Progress not found", success: false };

  let consecutiveCorrects = progress.consecutive_corrects ?? 0;
  let consecutiveWrongs = progress.consecutive_wrongs ?? 0;

  let hasReversedCurse = progress.has_reversed_curse ?? false;
  let hasBossShield = progress.has_boss_shield ?? false;
  let hasForceCharacterAttackType =
    progress.has_force_character_attack_type ?? false;
  let hasBothHpDecrease = progress.has_both_hp_decrease ?? false;
  let hasShuffle = progress.has_shuffle_ss ?? false;

  const challenge = await prisma.challenge.findUnique({
    where: { challenge_id: challengeId },
  });
  if (!challenge) return { message: "Challenge not found", success: false };

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
    hasReversedCurse = false;
    hasBossShield = false;
    hasForceCharacterAttackType = false;
    hasShuffle = false;

    const coinsToAdd =
      isBonusRound && characterDamage
        ? characterDamage
        : challenge.coins_reward;

    updateData = {
      ...updateData,
      wrong_challenges: wrongChallenges,
      coins_earned: { increment: coinsToAdd },
      total_points_earned: { increment: challenge.points_reward },
      total_exp_points_earned: { increment: challenge.points_reward },
      consecutive_corrects: consecutiveCorrects,
      consecutive_wrongs: consecutiveWrongs,
      has_reversed_curse: hasReversedCurse,
      has_boss_shield: hasBossShield,
      has_force_character_attack_type: hasForceCharacterAttackType,
      has_shuffle_ss: hasShuffle,
    };
  } else {
    if (!wrongChallenges.includes(challengeId)) {
      wrongChallenges.push(challengeId);
    }
    consecutiveCorrects = 0;
    consecutiveWrongs += 1;

    const level = await prisma.level.findUnique({
      where: { level_id: progress.level_id },
      include: { map: true, enemy: true },
    });
    if (level) {
      const enemy = level.enemy;

      if (consecutiveWrongs % 3 == 0) {
        const enemyName = enemy && enemy.enemy_name;

        switch (enemyName) {
          case "King Grimnir":
            hasReversedCurse = true;
            console.log(
              "- Reversal curse activated for King Grimnir after multiples of 3 consecutive wrongs"
            );
            break;
          case "Boss Joshy":
            hasBossShield = true;
            console.log(
              "- Shield activated for Boss Joshy after multiples of 3 consecutive wrongs"
            );
            break;
          case "Boss Darco":
            hasForceCharacterAttackType = true;
            console.log(
              "- Force character attack type into basic activated for Boss Darco after multiples of 3 consecutive wrongs"
            );
            break;
          case "Boss Scorcharach":
            hasBothHpDecrease = true;
            console.log(
              "- Both hp decreases for Boss Scorcharach after multiples of 3 consecutive wrongs"
            );
            break;
          case "Boss Maggmaw":
            hasShuffle = true;
            console.log(
              "- Options shuffle after for Boss Maggmaw multiples of 3 consecutive wrongs"
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
      has_boss_shield: hasBossShield,
      has_force_character_attack_type: hasForceCharacterAttackType,
      has_both_hp_decrease: hasBothHpDecrease,
      has_shuffle_ss: hasShuffle,
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
