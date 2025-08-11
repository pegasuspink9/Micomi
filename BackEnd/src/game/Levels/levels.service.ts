import { PrismaClient } from "@prisma/client";
import { formatDateTime } from "../../../helper/dateTimeHelper";

const prisma = new PrismaClient();

export const enterLevel = async (playerId: number, levelId: number) => {
  const level = await prisma.level.findUnique({
    where: { level_id: levelId },
    include: { enemies: true, challenges: true },
  });
  if (!level) throw new Error("Level not found");

  const firstLevel = await prisma.level.findFirst({
    where: { map_id: level.map_id },
    orderBy: { level_number: "asc" },
  });

  if (level.level_id === firstLevel?.level_id && !level.is_unlocked) {
    await prisma.level.update({
      where: { level_id: level.level_id },
      data: { is_unlocked: true },
    });

    level.is_unlocked = true;
  }

  if (level.level_id !== firstLevel?.level_id) {
    const latestProgress = await prisma.playerProgress.findFirst({
      where: { player_id: playerId },
      orderBy: { level_id: "desc" },
      include: { level: true },
    });

    if (
      !level.is_unlocked ||
      (latestProgress &&
        latestProgress.level.level_number < level.level_number - 1)
    ) {
      throw new Error("Level not unlocked yet");
    }
  }

  const progress = await prisma.playerProgress.findFirst({
    where: { player_id: playerId, level_id: levelId },
  });
  if (!progress) {
    await prisma.playerProgress.create({
      data: {
        player_id: playerId,
        level_id: levelId,
        current_level: level.level_number,
        score: 0,
        attempts: 0,
        player_answer: "",
        completed_at: null,
      },
    });
    return { level, enemies: level.enemies, challenges: level.challenges };
  }

  if (progress.is_completed) {
    return {
      level,
      enemies: level.enemies,
      challenges: level.challenges,
      completedAt: formatDateTime(progress.completed_at!),
    };
  }

  return { level, enemies: level.enemies, challenges: level.challenges };
};

export const unlockNextLevel = async (
  playerId: number,
  mapId: number,
  currentLevelNumber: number
) => {
  const nextLevel = await prisma.level.findFirst({
    where: {
      map_id: mapId,
      level_number: currentLevelNumber + 1,
      is_unlocked: false,
    },
  });

  if (nextLevel) {
    await prisma.level.update({
      where: { level_id: nextLevel.level_id },
      data: { is_unlocked: true },
    });

    const existingProgress = await prisma.playerProgress.findFirst({
      where: { player_id: playerId, level_id: nextLevel.level_id },
    });
    if (!existingProgress) {
      await prisma.playerProgress.create({
        data: {
          player_id: playerId,
          level_id: nextLevel.level_id,
          current_level: nextLevel.level_number,
          score: 0,
          attempts: 0,
          player_answer: "",
          completed_at: new Date(),
        },
      });
    }
  }
};
