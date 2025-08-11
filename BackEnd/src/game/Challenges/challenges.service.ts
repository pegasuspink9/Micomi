import { PrismaClient } from "@prisma/client";
import * as LevelService from "../Levels/levels.service";

const prisma = new PrismaClient();

export const areAllChallengesCompleted = async (
  playerId: number,
  levelId: number
): Promise<boolean> => {
  const progress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    select: { player_answer: true },
  });

  if (!progress) return false;

  const answers = progress.player_answer as Record<string, string>;

  const totalChallenges = await prisma.challenge.count({
    where: { level_id: levelId },
  });

  if (totalChallenges === 0) return true;

  const correctAnswersCount = await prisma.challenge.count({
    where: {
      level_id: levelId,
      OR: Object.entries(answers).map(([id, ans]) => ({
        challenge_id: parseInt(id),
        correct_answer: ans,
      })),
    },
  });

  return totalChallenges === correctAnswersCount;
};

export const submitChallenge = async (
  playerId: number,
  levelId: number,
  challengeId: number,
  answer: string
) => {
  const [challenge, level, progress] = await Promise.all([
    prisma.challenge.findUnique({ where: { challenge_id: challengeId } }),
    prisma.level.findUnique({
      where: { level_id: levelId },
      include: { enemies: true },
    }),
    prisma.playerProgress.findUnique({
      where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    }),
  ]);

  if (!challenge) throw new Error("Invalid challenge");
  if (!level) throw new Error("Invalid level");

  let currentProgress = progress;
  if (!currentProgress) {
    currentProgress = await prisma.playerProgress.create({
      data: {
        player_id: playerId,
        level_id: levelId,
        current_level: level.level_number,
        score: 0,
        attempts: 0,
        player_answer: {},
        completed_at: null,
      },
    });
  }

  const answers = currentProgress.player_answer as Record<string, string>;
  const wasCorrect =
    answers[challengeId.toString()] === challenge.correct_answer;
  answers[challengeId.toString()] = answer;
  const isCorrect = answer === challenge.correct_answer;

  const updatedProgress = await prisma.playerProgress.update({
    where: { progress_id: currentProgress.progress_id },
    data: {
      player_answer: answers,
      attempts: { increment: 1 },
      score:
        isCorrect && !wasCorrect
          ? { increment: challenge.points_reward }
          : currentProgress.score,
    },
  });

  if (isCorrect && !wasCorrect) {
    await prisma.player.update({
      where: { player_id: playerId },
      data: {
        total_points: { increment: challenge.points_reward },
        coins: { increment: challenge.coins_reward },
      },
    });
  }

  const challenges = await prisma.challenge.findMany({
    where: { level_id: levelId },
  });
  const allCompleted = challenges.every(
    (ch) => answers[ch.challenge_id.toString()] === ch.correct_answer
  );

  if (allCompleted && level.enemies.length === 0) {
    await prisma.playerProgress.update({
      where: { progress_id: currentProgress.progress_id },
      data: { is_completed: true, completed_at: new Date() },
    });

    if (level.level_type === "final") {
      const nextMap = await prisma.map.findFirst({
        where: { map_id: { gt: level.map_id }, is_active: false },
        orderBy: { map_id: "asc" },
      });
      if (nextMap) {
        await prisma.map.update({
          where: { map_id: nextMap.map_id },
          data: { is_active: true },
        });
      }
    } else {
      await LevelService.unlockNextLevel(
        playerId,
        level.map_id,
        level.level_number
      );
    }
  }

  return { isCorrect, score: updatedProgress.score };
};
