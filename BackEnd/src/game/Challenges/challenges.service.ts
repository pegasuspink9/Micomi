import { PrismaClient, Challenge } from "@prisma/client";
import * as LevelService from "../Levels/levels.service";
import * as CombatService from "../Combat/combat.service";
import * as EnergyService from "../Energy/energy.service";
import { formatTimer } from "../../../helper/dateTimeHelper";
import { CHALLENGE_TIME_LIMIT } from "../../../helper/timeSetter";
import {
  SubmitChallengeControllerResult,
  CompletionRewards,
} from "./challenges.types";

const prisma = new PrismaClient();

const arraysEqual = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((val, i) => val === b[i]);

const isTimedChallengeType = (type: string) =>
  ["multiple choice", "fill in the blank"].includes(type);

const buildChallengeWithTimer = (
  challenge: Challenge,
  timeRemaining: number
) => ({
  ...challenge,
  timeLimit: isTimedChallengeType(challenge.challenge_type)
    ? CHALLENGE_TIME_LIMIT
    : 0,
  timeRemaining: isTimedChallengeType(challenge.challenge_type)
    ? timeRemaining
    : 0,
  timer: isTimedChallengeType(challenge.challenge_type)
    ? formatTimer(timeRemaining)
    : null,
});

export const submitChallengeService = async (
  playerId: number,
  levelId: number,
  challengeId: number,
  answer: string[]
): Promise<
  SubmitChallengeControllerResult & {
    energy?: number;
    timeToNextEnergyRestore?: string | null;
  }
> => {
  const hasEnergy = await EnergyService.hasEnoughEnergy(playerId, 1);
  if (!hasEnergy) {
    const energyStatus = await EnergyService.getPlayerEnergyStatus(playerId);
    throw new Error(
      `Not enough energy! Next energy restore in: ${
        energyStatus.timeToNextRestore ?? "N/A"
      }`
    );
  }

  const [challenge, level, progress] = await Promise.all([
    prisma.challenge.findUnique({ where: { challenge_id: challengeId } }),
    prisma.level.findUnique({
      where: { level_id: levelId },
      include: { challenges: true, map: true },
    }),
    prisma.playerProgress.findUnique({
      where: {
        player_id_level_id: { player_id: playerId, level_id: levelId },
      },
    }),
  ]);
  if (!challenge) throw new Error("Challenge not found");
  if (!level) throw new Error("Level not found");

  let currentProgress = progress;
  if (!currentProgress) {
    currentProgress = await prisma.playerProgress.create({
      data: {
        player_id: playerId,
        level_id: levelId,
        current_level: level.level_number,
        attempts: 0,
        player_answer: {},
        wrong_challenges: [],
        completed_at: null,
        challenge_start_time: new Date(),
        is_completed: false,
      },
    });
  }

  const enemy = await prisma.enemy.findFirst({
    where: {
      enemy_map: level.map.map_name,
      enemy_difficulty: level.level_difficulty,
    },
  });
  if (!enemy)
    throw new Error("No enemy found for this level’s map + difficulty");

  const challengeStart = new Date(currentProgress.challenge_start_time!);
  const now = new Date();
  const elapsed = (now.getTime() - challengeStart.getTime()) / 1000;
  const timeRemaining = Math.max(0, CHALLENGE_TIME_LIMIT - elapsed);

  const correctAnswer = challenge.correct_answer as string[];
  const isCorrect = arraysEqual(answer, correctAnswer);

  const updatedProgress = await prisma.playerProgress.update({
    where: { progress_id: currentProgress.progress_id },
    data: {
      player_answer: {
        ...(currentProgress.player_answer as Record<string, string[]>),
        [challengeId.toString()]: answer,
      },
      attempts: { increment: 1 },
    },
  });

  let wrongChallenges = (updatedProgress.wrong_challenges ?? []) as number[];
  let fightResult: any;
  let message: string;
  const useHardFight =
    level.level_difficulty === "hard" || level.level_difficulty === "final";

  if (
    isTimedChallengeType(challenge.challenge_type) &&
    elapsed > CHALLENGE_TIME_LIMIT
  ) {
    fightResult = useHardFight
      ? await CombatService.fightBossEnemy(playerId, enemy.enemy_id, false)
      : await CombatService.fightEnemy(playerId, enemy.enemy_id, false);
    message = "Time's up! Enemy attacked you.";
  } else if (isCorrect) {
    wrongChallenges = wrongChallenges.filter(
      (id) => id !== challenge.challenge_id
    );
    await prisma.playerProgress.update({
      where: { progress_id: currentProgress.progress_id },
      data: { wrong_challenges: wrongChallenges },
    });

    fightResult = useHardFight
      ? await CombatService.fightBossEnemy(playerId, enemy.enemy_id, true)
      : await CombatService.fightEnemy(playerId, enemy.enemy_id, true);
    message = "Correct! You attacked the enemy.";
  } else {
    if (useHardFight) {
      if (!wrongChallenges.includes(challenge.challenge_id)) {
        wrongChallenges.push(challenge.challenge_id);
      }
    } else {
      wrongChallenges = wrongChallenges.filter(
        (id) => id !== challenge.challenge_id
      );
      wrongChallenges.push(challenge.challenge_id);
    }
    await prisma.playerProgress.update({
      where: { progress_id: currentProgress.progress_id },
      data: { wrong_challenges: wrongChallenges },
    });

    fightResult = useHardFight
      ? await CombatService.fightBossEnemy(playerId, enemy.enemy_id, false)
      : await CombatService.fightEnemy(playerId, enemy.enemy_id, false);

    message =
      challenge.challenge_type === "code with guide"
        ? "Wrong! You'll need to try again on this same challenge."
        : isTimedChallengeType(challenge.challenge_type)
        ? `Wrong! You'll see this challenge again. Remaining time: ${formatTimer(
            Math.max(0, CHALLENGE_TIME_LIMIT - elapsed)
          )}`
        : "Wrong! You'll see this challenge again.";
  }

  let nextChallenge: any = null;
  if (useHardFight && !isCorrect) {
    nextChallenge = buildChallengeWithTimer(challenge, timeRemaining);
  } else if (!useHardFight) {
    const next = await getNextChallengeService(playerId, levelId);
    nextChallenge = next.nextChallenge;
  }

  if (nextChallenge) {
    await prisma.playerProgress.update({
      where: { progress_id: currentProgress.progress_id },
      data: { challenge_start_time: new Date() },
    });
  }

  const answeredIds = Object.keys(updatedProgress.player_answer ?? {}).map(
    Number
  );
  const wrongChallengesArr = (updatedProgress.wrong_challenges ??
    []) as number[];
  const allCompleted =
    answeredIds.length === level.challenges.length &&
    wrongChallengesArr.length === 0;

  let completionRewards: CompletionRewards | undefined = undefined;
  let nextLevel: SubmitChallengeControllerResult["nextLevel"] = null;

  if (allCompleted && !currentProgress.is_completed) {
    await prisma.playerProgress.update({
      where: { progress_id: currentProgress.progress_id },
      data: { is_completed: true, completed_at: new Date() },
    });

    const totalExp = level.challenges.reduce(
      (sum, c) => sum + c.points_reward,
      0
    );
    const totalCoins = level.challenges.reduce(
      (sum, c) => sum + c.coins_reward,
      0
    );

    if (!progress?.is_completed) {
      await prisma.player.update({
        where: { player_id: playerId },
        data: {
          total_points: { increment: totalExp },
          coins: { increment: totalCoins },
        },
      });
    }

    completionRewards = {
      feedbackMessage:
        level.feedback_message ?? `You completed Level ${level.level_number}!`,
      currentTotalPoints: totalExp,
      currentExpPoints: totalCoins,
    };

    nextLevel = await LevelService.unlockNextLevel(
      playerId,
      level.map_id,
      level.level_number
    );
  }

  const energyStatus = await EnergyService.getPlayerEnergyStatus(playerId);

  const result: SubmitChallengeControllerResult = {
    isCorrect,
    attempts: updatedProgress.attempts,
    fightResult,
    message,
    nextChallenge,
    levelStatus: {
      isCompleted: allCompleted,
      battleWon: fightResult?.status === "won",
      battleLost: fightResult?.status === "lost",
      canProceed: allCompleted && !!nextLevel,
      showFeedback: allCompleted,
      playerHealth: fightResult?.charHealth ?? null,
      enemyHealth: fightResult?.enemyHealth ?? null,
    },
    completionRewards,
    nextLevel,
  };

  return {
    ...result,
    energy: energyStatus.energy,
    timeToNextEnergyRestore: energyStatus.timeToNextRestore,
  };
};

export const getNextChallengeService = async (
  playerId: number,
  levelId: number
) => {
  const progress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    include: { level: { include: { challenges: true } } },
  });
  if (!progress) throw new Error("Player progress not found");
  if (!progress.level) throw new Error("Level not found");

  switch (progress.level.level_difficulty) {
    case "easy":
      return getNextChallengeEasy(progress);
    case "hard":
    case "final":
      return getNextChallengeHard(progress);
    default:
      throw new Error("Unsupported difficulty");
  }
};

const getNextChallengeEasy = async (progress: any) => {
  const { level } = progress;

  const wrongChallenges = (progress.wrong_challenges as number[] | null) ?? [];
  const answeredIds = Object.keys(
    (progress.player_answer as Record<string, string[]> | null) ?? {}
  ).map(Number);

  let nextChallenge =
    level.challenges.find(
      (c: Challenge) =>
        !answeredIds.includes(c.challenge_id) &&
        !wrongChallenges.includes(c.challenge_id)
    ) || null;

  if (!nextChallenge && wrongChallenges.length > 0) {
    const firstWrongId = wrongChallenges[0];
    nextChallenge =
      level.challenges.find(
        (c: Challenge) => c.challenge_id === firstWrongId
      ) || null;
  }

  return wrapWithTimer(progress, nextChallenge);
};

const getNextChallengeHard = async (progress: any) => {
  const { level } = progress;

  const answeredIds = Object.keys(
    (progress.player_answer as Record<string, string[]> | null) ?? {}
  ).map(Number);
  const wrongChallenges = (progress.wrong_challenges as number[] | null) ?? [];

  let nextChallenge =
    level.challenges.find(
      (c: Challenge) => !answeredIds.includes(c.challenge_id)
    ) || null;

  if (!nextChallenge && wrongChallenges.length > 0) {
    nextChallenge =
      level.challenges.find((c: Challenge) =>
        wrongChallenges.includes(c.challenge_id)
      ) || null;
  }

  return wrapWithTimer(progress, nextChallenge);
};

const wrapWithTimer = async (progress: any, challenge: Challenge | null) => {
  if (!challenge) return { nextChallenge: null };

  const challengeStart = new Date(progress.challenge_start_time!);
  const elapsed = (Date.now() - challengeStart.getTime()) / 1000;
  const timeRemaining = Math.max(0, CHALLENGE_TIME_LIMIT - elapsed);

  await prisma.playerProgress.update({
    where: {
      player_id_level_id: {
        player_id: progress.player_id,
        level_id: progress.level_id,
      },
    },
    data: { challenge_start_time: new Date() },
  });

  return {
    nextChallenge: buildChallengeWithTimer(challenge, timeRemaining),
  };
};
