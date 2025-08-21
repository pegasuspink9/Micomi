import { PrismaClient } from "@prisma/client";
import { formatDateTime } from "../../../helper/dateTimeHelper";

const prisma = new PrismaClient();

const randomize = <T>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

export const enterLevel = async (playerId: number, levelId: number) => {
  const level = await prisma.level.findUnique({
    where: { level_id: levelId },
    include: { map: true, challenges: true },
  });
  if (!level) throw new Error("Level not found");

  const enemy = await prisma.enemy.findFirst({
    where: {
      enemy_map: level.map.map_name,
      enemy_difficulty: level.level_difficulty,
    },
  });
  if (!enemy) {
    throw new Error(
      `No enemy found for map ${level.map.map_name} and difficulty ${level.level_difficulty}`
    );
  }

  if (level.level_difficulty === "easy") {
    const invalid = level.challenges.some(
      (c) =>
        c.challenge_type !== "multiple choice" &&
        c.challenge_type !== "fill in the blank"
    );
    if (invalid) {
      throw new Error(
        "Easy levels can only have 'multiple choice' or 'fill in the blank' challenges"
      );
    }
    level.challenges = randomize(level.challenges);
  }

  if (level.level_difficulty === "medium") {
    const invalid = level.challenges.some(
      (c) => !c.guide || c.guide.trim() === ""
    );
    if (invalid) {
      throw new Error("All Medium level challenges must have a guide");
    }
  }

  if (level.level_difficulty === "hard") {
    const invalid = level.challenges.some((c) => {
      if (!c.test_cases) return true;
      try {
        const parsed =
          typeof c.test_cases === "string"
            ? JSON.parse(c.test_cases)
            : c.test_cases;
        return !Array.isArray(parsed) || parsed.length === 0;
      } catch {
        return true;
      }
    });
    if (invalid)
      throw new Error("All Hard level challenges must have test cases");
  }

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

  const challengesWithTimer = level.challenges.map((ch) =>
    ["multiple choice", "fill in the blank"].includes(ch.challenge_type)
      ? { ...ch, timeLimit: 10 }
      : ch
  );

  if (!progress) {
    await prisma.playerProgress.create({
      data: {
        player_id: playerId,
        level_id: levelId,
        current_level: level.level_number,
        attempts: 0,
        player_answer: {},
        completed_at: null,
        challenge_start_time: new Date(),
      },
    });
    return { level, enemies: [enemy], challenges: challengesWithTimer };
  }

  if (progress.is_completed) {
    return {
      level,
      enemies: [enemy],
      challenges: randomize(level.challenges),
      completedAt: formatDateTime(progress.completed_at!),
    };
  }

  return { level, enemies: [enemy], challenges: level.challenges };
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

  if (!nextLevel) return null;

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
        attempts: 0,
        player_answer: {},
        completed_at: new Date(),
        challenge_start_time: new Date(),
      },
    });
  }

  return nextLevel;
};
