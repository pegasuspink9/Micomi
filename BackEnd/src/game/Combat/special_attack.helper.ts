import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function updateProgressForChallenge(
  progressId: number,
  challengeId: number,
  isCorrect: boolean,
  finalAnswer: string[],
  isBonusRound: boolean = false,
  characterDamage?: number,
  isReveal: boolean = false,
) {
  const progress = await prisma.playerProgress.findUnique({
    where: { progress_id: progressId },
  });
  if (!progress) return { message: "Progress not found", success: false };

  const rewardsAlreadyClaimed = progress.has_received_rewards ?? false;

  let consecutiveCorrects = progress.consecutive_corrects ?? 0;
  let consecutiveWrongs = progress.consecutive_wrongs ?? 0;

  let hasReversedCurse = progress.has_reversed_curse ?? false;
  let hasBossShield = progress.has_boss_shield ?? false;
  let hasForceCharacterAttackType =
    progress.has_force_character_attack_type ?? false;
  let hasBothHpDecrease = progress.has_both_hp_decrease ?? false;
  let hasShuffle = progress.has_shuffle_ss ?? false;
  let hasPermuted = progress.has_permuted_ss ?? false;
  let hasOnlyBlanks = progress.has_only_blanks_ss ?? false;
  let hasDollarSign = progress.has_dollar_sign_ss ?? false;
  let hasReverseWords = progress.has_reverse_words_ss ?? false;

  // Check if ANY SS was active before this answer
  const wasAnySsActive =
    hasReversedCurse ||
    hasBossShield ||
    hasForceCharacterAttackType ||
    hasBothHpDecrease ||
    hasShuffle ||
    hasPermuted ||
    hasOnlyBlanks ||
    hasDollarSign ||
    hasReverseWords;

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
  let newAnswers = existingAnswers;
  if (!isReveal) {
    newAnswers = { ...existingAnswers, [challengeId.toString()]: finalAnswer };
  }

  let wrongChallenges = (progress.wrong_challenges ?? []) as number[];

  let newExpectedOutput = progress.player_expected_output ?? [];

  if (isCorrect && !alreadyAnsweredCorrectly) {
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

  let bossSkillActivated = false;

  if (isCorrect) {
    wrongChallenges = wrongChallenges.filter((id) => id !== challengeId);
    consecutiveCorrects += 1;
    consecutiveWrongs = 0;

    if (consecutiveCorrects > 3) {
      consecutiveCorrects = 1;
    }

    let coinsToAdd = 0;
    let pointsToAdd = 0;

    if (!rewardsAlreadyClaimed) {
      coinsToAdd =
        isBonusRound && characterDamage
          ? characterDamage
          : challenge.coins_reward;

      pointsToAdd = challenge.points_reward;
    }

    updateData = {
      ...updateData,
      wrong_challenges: wrongChallenges,
      coins_earned: { increment: coinsToAdd },
      total_points_earned: { increment: challenge.points_reward },
      total_exp_points_earned: { increment: challenge.points_reward },
      consecutive_corrects: consecutiveCorrects,
      consecutive_wrongs: consecutiveWrongs,
      boss_skill_activated: false,
    };
  } else {
    if (!wrongChallenges.includes(challengeId)) {
      wrongChallenges.push(challengeId);
    }
    consecutiveCorrects = 0;
    consecutiveWrongs += 1;

    if (consecutiveWrongs > 3) {
      consecutiveWrongs = 1;
    }

    const level = await prisma.level.findUnique({
      where: { level_id: progress.level_id },
      include: { map: true, enemy: true },
    });

    if (level) {
      const enemy = level.enemy;

      if (!wasAnySsActive && consecutiveWrongs % 3 == 0) {
        bossSkillActivated = true;

        const enemyName = enemy && enemy.enemy_name;

        switch (enemyName) {
          case "Boss Darco":
            hasReversedCurse = true;
            console.log(
              "- Reversal curse activated for Boss Darco after multiples of 3 consecutive wrongs",
            );
            break;
          case "Boss Joshy":
            hasBossShield = true;
            console.log(
              "- Shield activated for Boss Joshy after multiples of 3 consecutive wrongs",
            );
            break;
          case "King Grimnir":
            hasForceCharacterAttackType = true;
            console.log(
              "- Force character attack type into basic activated for King Grimnir after multiples of 3 consecutive wrongs",
            );
            break;
          case "Boss Scorcharach":
            hasBothHpDecrease = true;
            console.log(
              "- Both hp decreases for Boss Scorcharach after multiples of 3 consecutive wrongs",
            );
            break;
          case "Boss Maggmaw":
            hasShuffle = true;
            console.log(
              "- Options shuffle after for Boss Maggmaw after multiples of 3 consecutive wrongs",
            );
            break;
          case "Boss Pyroformic":
            hasPermuted = true;
            console.log(
              "- Options words unordered after for Boss Pyroformic after multiples of 3 consecutive wrongs",
            );
            break;
          case "King Feanaly":
            hasOnlyBlanks = true;
            console.log("- Only Blanks curse activated for King Feanaly");
            break;
          case "Boss Icycreamero":
            hasDollarSign = true;
            console.log("- Dollar Sign curse activated for Boss Icycreamero");
            break;
          case "Boss Scythe":
            hasReverseWords = true;
            console.log("- Reverse Words curse activated for Boss Scythe");
            break;
        }
      } else {
        bossSkillActivated = false;
      }
    }

    updateData = {
      ...updateData,
      wrong_challenges: wrongChallenges,
      consecutive_corrects: consecutiveCorrects,
      consecutive_wrongs: consecutiveWrongs,
      boss_skill_activated: bossSkillActivated,
    };
  }

  if (wasAnySsActive) {
    hasReversedCurse = false;
    hasForceCharacterAttackType = false;
    hasBothHpDecrease = false;
    hasShuffle = false;
    hasPermuted = false;
    hasOnlyBlanks = false;
    hasDollarSign = false;
    hasReverseWords = false;
    console.log("- SS deactivated after being used for this challenge");
  }

  updateData = {
    ...updateData,
    has_reversed_curse: hasReversedCurse,
    has_boss_shield: hasBossShield,
    has_force_character_attack_type: hasForceCharacterAttackType,
    has_both_hp_decrease: hasBothHpDecrease,
    has_shuffle_ss: hasShuffle,
    has_permuted_ss: hasPermuted,
    has_only_blanks_ss: hasOnlyBlanks,
    has_dollar_sign_ss: hasDollarSign,
    has_reverse_words_ss: hasReverseWords,
  };

  const updatedProgress = await prisma.playerProgress.update({
    where: { progress_id: progressId },
    data: updateData,
  });

  return {
    updatedProgress,
    alreadyAnsweredCorrectly,
  };
}
