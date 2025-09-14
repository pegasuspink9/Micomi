import { PrismaClient, QuestType } from "@prisma/client";
import * as LevelService from "../Levels/levels.service";
import * as CombatService from "../Combat/combat.service";
import { formatTimer } from "../../../helper/dateTimeHelper";
import { SubmitChallengeServiceResult } from "./challenges.types";

const prisma = new PrismaClient();

const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

export const submitChallengeService = async (
  playerId: number,
  levelId: number,
  challengeId: number,
  answer: string[]
): Promise<SubmitChallengeServiceResult> => {
  const [challenge, level, progress] = await Promise.all([
    prisma.challenge.findUnique({ where: { challenge_id: challengeId } }),
    prisma.level.findUnique({
      where: { level_id: levelId },
      include: { enemies: true, challenges: true },
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

  const enemy = level.enemies[0];
  if (!enemy) throw new Error("No enemy found for this level");

  const challengeStart = new Date(currentProgress.challenge_start_time!);
  const now = new Date();
  const elapsed = (now.getTime() - challengeStart.getTime()) / 1000;
  const timeRemaining = Math.max(0, 10 - elapsed);

  const correctAnswer = challenge.correct_answer as string[];
  const isCorrect = arraysEqual(answer, correctAnswer);

  const answers = {
    ...(currentProgress.player_answer as Record<string, string[]>),
    [challengeId.toString()]: answer,
  };

  let wrongChallenges = (currentProgress.wrong_challenges ?? []) as number[];

  const updatedProgress = await prisma.playerProgress.update({
    where: { progress_id: currentProgress.progress_id },
    data: {
      player_answer: answers,
      attempts: { increment: 1 },
    },
  });

  let fightResult;
  let message;

  if (elapsed > 10) {
    fightResult = await CombatService.fightEnemy(
      playerId,
      enemy.enemy_id,
      false
    );
    message = "Time's up! Enemy attacked you.";
  } else if (isCorrect) {
    wrongChallenges = wrongChallenges.filter(
      (id) => id !== challenge.challenge_id
    );

    await prisma.playerProgress.update({
      where: { progress_id: currentProgress.progress_id },
      data: { wrong_challenges: wrongChallenges },
    });

    fightResult = await CombatService.fightEnemy(
      playerId,
      enemy.enemy_id,
      true
    );

    message = "Correct! You attacked the enemy.";
  } else {
    if (!wrongChallenges.includes(challenge.challenge_id)) {
      wrongChallenges.push(challenge.challenge_id);
    }

    await prisma.playerProgress.update({
      where: { progress_id: currentProgress.progress_id },
      data: { wrong_challenges: wrongChallenges },
    });

    fightResult = await CombatService.fightEnemy(
      playerId,
      enemy.enemy_id,
      false
    );
    message = `Wrong! You'll see this challenge again. Remaining time: ${formatTimer(
      Math.max(0, 10 - elapsed)
    )}`;
  }

  const nextChallenge = await getNextChallengeService(playerId, levelId);

  const answersRecord = (updatedProgress.player_answer ?? {}) as Record<
    string,
    string
  >;
  const answeredIds = Object.keys(answersRecord).map(Number);
  const wrongChallengesArr = (updatedProgress.wrong_challenges ??
    []) as number[];

  const totalChallenges = level.challenges.length;

  const allCompleted =
    answeredIds.length === totalChallenges && wrongChallengesArr.length === 0;

  if (allCompleted && !currentProgress.is_completed) {
    // ✅ Mark completed
    await prisma.playerProgress.update({
      where: { progress_id: currentProgress.progress_id },
      data: { is_completed: true, completed_at: new Date() },
    });

    // ✅ Compute exp + coins only ONCE
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
          total_points: { increment: challenge.points_reward },
          coins: { increment: challenge.coins_reward },
        },
      });
    }

    await LevelService.unlockNextLevel(
      playerId,
      level.map_id,
      level.level_number
    );
  }

  return {
    isCorrect,
    attempts: updatedProgress.attempts,
    fightResult,
    message,
    nextChallenge: nextChallenge
      ? {
          ...nextChallenge.nextChallenge,
          timeLimit: 10,
          timeRemaining: timeRemaining,
          timer: formatTimer(timeRemaining),
        }
      : null,
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

  const { level } = progress;
  if (!level) throw new Error("Level not found");

  const answeredIds = Object.keys(progress.player_answer ?? {}).map(Number);
  const wrongChallenges: number[] =
    (progress.wrong_challenges as number[]) ?? [];

  let nextChallenge;

  if (wrongChallenges.length > 0) {
    nextChallenge = level.challenges.find(
      (c) => c.challenge_id === wrongChallenges[0]
    );
  } else {
    nextChallenge = level.challenges.find(
      (c) => !answeredIds.includes(c.challenge_id)
    );
  }

  if (!nextChallenge) {
    return { nextChallenge: null };
  }

  await prisma.playerProgress.update({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    data: { challenge_start_time: new Date() },
  });

  const challengeWithTimer = ["multiple choice", "fill in the blank"].includes(
    nextChallenge.challenge_type
  )
    ? { ...nextChallenge, timeLimit: 10 }
    : nextChallenge;

  return { nextChallenge: challengeWithTimer };
};

export const deleteChallengeAnswer = async (
  playerId: number,
  levelId: number,
  challengeId: number
) => {
  const progress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
  });

  if (!progress) throw new Error("Progress not found");

  const answers = { ...(progress.player_answer as Record<string, string>) };
  delete answers[challengeId.toString()];

  await prisma.playerProgress.update({
    where: { progress_id: progress.progress_id },
    data: {
      player_answer: answers,
      challenge_start_time: new Date(),
    },
  });

  return { success: true, message: "Answer deleted from database." };
};
