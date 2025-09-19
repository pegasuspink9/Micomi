import { PrismaClient } from "@prisma/client";
import { ChallengeDTO } from "./levels.types";
import * as EnergyService from "../Energy/energy.service";
import { formatTimer } from "../../../helper/dateTimeHelper";
import { CHALLENGE_TIME_LIMIT } from "../../../helper/timeSetter";

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

  if (level.level_difficulty === "hard" || level.level_difficulty === "final") {
    const invalid = level.challenges.some(
      (c) => !c.guide || c.guide.trim() === ""
    );
    if (invalid) {
      throw new Error("All Hard level challenges must have a guide");
    }
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

  let progress = await prisma.playerProgress.findFirst({
    where: { player_id: playerId, level_id: levelId },
  });

  const selectedChar = await prisma.playerCharacter.findFirst({
    where: { player_id: playerId, is_selected: true },
    include: { character: true },
  });

  if (!selectedChar) {
    throw new Error("No character selected for this player");
  }

  const character = selectedChar.character;

  const challengeCount = await prisma.challenge.count({
    where: { level_id: levelId },
  });

  let enemyMaxHp: number = enemy.enemy_health;

  if (level.level_difficulty === "easy") {
    enemyMaxHp = enemy.enemy_health;
  } else if (
    level.level_difficulty === "hard" ||
    level.level_difficulty === "final"
  ) {
    enemyMaxHp = enemy.enemy_health * challengeCount;
  }

  if (!progress) {
    progress = await prisma.playerProgress.create({
      data: {
        player_id: playerId,
        level_id: levelId,
        current_level: level.level_number,
        attempts: 0,
        player_answer: {},
        completed_at: null,
        challenge_start_time: new Date(),
        player_hp: character.health,
        enemy_hp: enemyMaxHp,
        battle_status: "in_progress",
        is_completed: false,
      },
    });
  }

  if (progress.is_completed) {
    progress = await prisma.playerProgress.update({
      where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
      data: {
        player_hp: character.health,
        enemy_hp: enemyMaxHp,
        battle_status: "in_progress",
        wrong_challenges: [],
        player_answer: {},
        is_completed: false,
        completed_at: null,
        challenge_start_time: new Date(),
      },
    });
  }

  const challengesWithTimer: ChallengeDTO[] = level.challenges.map((ch) => {
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
  });

  const firstChallenge = challengesWithTimer[0] ?? null;

  const energyStatus = await EnergyService.getPlayerEnergyStatus(playerId);

  const selectedCharHealth = character.health;

  if (!progress.is_completed) {
    await prisma.playerProgress.update({
      where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
      data: { player_hp: character.health, enemy_hp: enemyMaxHp },
    });
  }

  return {
    level: {
      level_id: level.level_id,
      level_number: level.level_number,
      level_difficulty: level.level_difficulty,
    },
    enemy: {
      enemy_id: enemy.enemy_id,
      enemy_health: enemyMaxHp,
    },
    selectedCharacter: {
      character_id: character.character_id,
      name: character.character_name,
      current_health: selectedCharHealth,
      max_health: character.health,
      damage: character.character_damage,
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
