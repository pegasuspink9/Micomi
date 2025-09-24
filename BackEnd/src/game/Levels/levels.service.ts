import {
  PrismaClient,
  Level,
  Challenge,
  PlayerProgress,
  PlayerCharacter,
  Enemy,
} from "@prisma/client";
import { ChallengeDTO } from "./levels.types";
import * as EnergyService from "../Energy/energy.service";
import { formatTimer } from "../../../helper/dateTimeHelper";
import { CHALLENGE_TIME_LIMIT } from "../../../helper/timeSetter";

const prisma = new PrismaClient();

const randomize = <T>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

export const previewLevel = async (playerId: number, levelId: number) => {
  const level: (Level & { map: any; challenges: Challenge[] }) | null =
    await prisma.level.findUnique({
      where: { level_id: levelId },
      include: {
        map: true,
        challenges: true,
      },
    });

  if (!level) throw new Error("Level not found");

  const enemy: Enemy | null = await prisma.enemy.findFirst({
    where: {
      enemy_map: level.map.map_name,
      enemy_difficulty: level.level_difficulty,
    },
  });
  if (!enemy)
    throw new Error(
      `No enemy found for map ${level.map.map_name} and difficulty ${level.level_difficulty}`
    );

  const selectedChar: (PlayerCharacter & { character: any }) | null =
    await prisma.playerCharacter.findFirst({
      where: { player_id: playerId, is_selected: true },
      include: { character: true },
    });
  if (!selectedChar) throw new Error("No character selected for this player");

  const character = selectedChar.character;
  const playerMaxHealth = character.health;
  const enemyMaxHealth = enemy.enemy_health * level.challenges.length;

  const totalPoints = level.challenges.reduce(
    (sum, ch) => sum + (ch.points_reward ?? 0),
    0
  );

  const totalCoins = level.challenges.reduce(
    (sum, ch) => sum + (ch.coins_reward ?? 0),
    0
  );

  const energyStatus = await EnergyService.getPlayerEnergyStatus(playerId);

  return {
    level: {
      level_id: level.level_id,
      level_number: level.level_number,
      level_difficulty: level.level_difficulty,
      level_title: level.level_title,
      content: level.content,
      total_points: totalPoints,
      total_coins: totalCoins,
    },
    enemy: {
      enemy_id: enemy.enemy_id,
      enemy_health: enemyMaxHealth,
      enemy_idle: enemy.enemy_avatar,
    },
    selectedCharacter: {
      character_id: character.character_id,
      name: character.character_name,
      current_health: playerMaxHealth,
      max_health: playerMaxHealth,
      damage: character.character_damage,
      character_idle: character.avatar_image,
    },
    energy: energyStatus.energy,
    timeToNextEnergyRestore: energyStatus.timeToNextRestore,
  };
};

export const enterLevel = async (playerId: number, levelId: number) => {
  const level: (Level & { map: any; challenges: Challenge[] }) | null =
    await prisma.level.findUnique({
      where: { level_id: levelId },
      include: {
        map: true,
        challenges: true,
      },
    });

  if (!level) throw new Error("Level not found");

  level.challenges.sort((a, b) => a.challenge_id - b.challenge_id);

  if (level.level_difficulty === "easy") {
    const invalid = level.challenges.some(
      (c: Challenge) =>
        c.challenge_type !== "multiple choice" &&
        c.challenge_type !== "fill in the blank"
    );
    if (invalid)
      throw new Error(
        "Easy levels can only have 'multiple choice' or 'fill in the blank' challenges"
      );
    level.challenges = randomize(level.challenges);
  }

  const enemy: Enemy | null = await prisma.enemy.findFirst({
    where: {
      enemy_map: level.map.map_name,
      enemy_difficulty: level.level_difficulty,
    },
  });
  if (!enemy)
    throw new Error(
      `No enemy found for map ${level.map.map_name} and difficulty ${level.level_difficulty}`
    );

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
    const latestProgress: (PlayerProgress & { level: Level }) | null =
      await prisma.playerProgress.findFirst({
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

  const selectedChar: (PlayerCharacter & { character: any }) | null =
    await prisma.playerCharacter.findFirst({
      where: { player_id: playerId, is_selected: true },
      include: { character: true },
    });

  if (!selectedChar) throw new Error("No character selected for this player");

  const character = selectedChar.character;
  const playerMaxHealth = character.health;
  const enemyMaxHealth = enemy.enemy_health * level.challenges.length;

  console.log("🔄 ENTERING LEVEL - Health Reset:");
  console.log("- Player max health:", playerMaxHealth);
  console.log("- Enemy max health (scaled):", enemyMaxHealth);

  const existingProgress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
  });

  if (existingProgress) {
    await prisma.playerProgress.delete({
      where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    });
    console.log("- Deleted existing progress");
  }

  const progress = await prisma.playerProgress.create({
    data: {
      player_id: playerId,
      level_id: levelId,
      current_level: level.level_number,
      attempts: 0,
      player_answer: {},
      completed_at: null,
      challenge_start_time: new Date(),
      player_hp: playerMaxHealth,
      enemy_hp: enemyMaxHealth,
      battle_status: "in_progress",
      is_completed: false,
      wrong_challenges: [],
    },
  });

  const verification = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
  });
  console.log("- VERIFIED enemy_hp in DB:", verification?.enemy_hp);
  console.log("- VERIFIED player_hp in DB:", verification?.player_hp);

  const challengesWithTimer: ChallengeDTO[] = level.challenges.map(
    (ch: Challenge) => {
      let timeLimit = 0;
      if (
        level.level_difficulty === "easy" &&
        ["multiple choice", "fill in the blank"].includes(ch.challenge_type)
      ) {
        timeLimit = CHALLENGE_TIME_LIMIT;
      }
      return {
        ...ch,
        timeLimit,
        timeRemaining: timeLimit,
        timer: formatTimer(timeLimit),
      };
    }
  );

  const firstChallenge = challengesWithTimer[0] ?? null;
  const energyStatus = await EnergyService.getPlayerEnergyStatus(playerId);

  return {
    level: {
      level_id: level.level_id,
      level_number: level.level_number,
      level_difficulty: level.level_difficulty,
      level_title: level.level_title,
      content: level.content,
    },
    enemy: {
      enemy_id: enemy.enemy_id,
      enemy_health: enemyMaxHealth,
      enemy_idle: enemy.enemy_avatar,
    },
    selectedCharacter: {
      character_id: character.character_id,
      name: character.character_name,
      current_health: playerMaxHealth,
      max_health: playerMaxHealth,
      damage: character.character_damage,
      character_idle: character.avatar_image,
    },
    currentChallenge: firstChallenge,
    energy: energyStatus.energy,
    timeToNextEnergyRestore: energyStatus.timeToNextRestore,
  };
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
