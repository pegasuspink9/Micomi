import {
  PrismaClient,
  Level,
  Challenge,
  PlayerProgress,
  PlayerCharacter,
  Enemy,
  BattleStatus,
  QuestType,
} from "@prisma/client";
import { ChallengeDTO } from "./levels.types";
import * as EnergyService from "../Energy/energy.service";
import { formatTimer } from "../../../helper/dateTimeHelper";
import { getBaseEnemyHp } from "../Combat/combat.service";
import { CHALLENGE_TIME_LIMIT } from "../../../helper/timeSetter";
import { updateQuestProgress } from "../Quests/quests.service";
import { getBackgroundForLevel } from "../../../helper/combatBackgroundHelper";

const prisma = new PrismaClient();

export const previewLevel = async (playerId: number, levelId: number) => {
  const level = (await prisma.level.findUnique({
    where: { level_id: levelId },
    include: {
      map: true,
      challenges: true,
      potionShopByLevel: true,
      lessons: true,
      enemy: true,
    },
  })) as
    | (Level & {
        map: any;
        challenges: Challenge[];
        lessons: any;
        potionShopByLevel: any;
        enemy: Enemy | null;
      })
    | null;
  if (!level) throw new Error("Level not found");

  if (level.level_type === "shopButton") {
    const progress = await prisma.playerProgress.findUnique({
      where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    });

    if (progress?.done_shop_level) {
      throw new Error("Shop level already completed, cannot preview again");
    }
  }

  const totalPoints = level.challenges.reduce(
    (sum, ch) => sum + Number(ch.points_reward ?? 0),
    0
  );
  const totalCoins = level.challenges.reduce(
    (sum, ch) => sum + Number(ch.coins_reward ?? 0),
    0
  );

  const energyStatus = await EnergyService.getPlayerEnergyStatus(playerId);
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!player) throw new Error("Player not found");

  const potionConfig = await prisma.potionShopByLevel.findUnique({
    where: { level_id: levelId },
  });

  let potionShop: any[] = [];
  if (potionConfig) {
    const potions = await prisma.potionShop.findMany();
    const playerPotions = await prisma.playerPotion.findMany({
      where: { player_id: playerId },
    });
    const playerLevelPotions = await prisma.playerLevelPotion.findMany({
      where: { player_id: playerId, level_id: levelId },
    });

    potionShop = potions
      .map((p) => {
        const globalOwned =
          playerPotions.find((pp) => pp.potion_shop_id === p.potion_shop_id)
            ?.quantity ?? 0;
        const levelBought =
          playerLevelPotions.find(
            (plp) => plp.potion_shop_id === p.potion_shop_id
          )?.quantity ?? 0;

        const rawLimit =
          potionConfig[
            `${p.potion_type.toLowerCase()}_quantity` as keyof typeof potionConfig
          ] ?? 0;

        const limit = Number(rawLimit ?? 0);

        const isAvailable = potionConfig.potions_avail
          ? (potionConfig.potions_avail as string[]).includes(p.potion_type)
          : limit > 0;
        if (!isAvailable) return null;

        return {
          player_owned_quantity: globalOwned,
          potion_id: p.potion_shop_id,
          potion_type: p.potion_type,
          description: p.potion_description,
          potion_price: p.potion_price,
          potion_url: p.potion_url,
          limit,
          boughtInLevel: levelBought,
          remainToBuy: Math.max(0, limit - levelBought),
        };
      })
      .filter(Boolean);
  }

  const lessons = await prisma.level.findFirst({
    where: { level_id: levelId },
    include: { lessons: true },
  });

  switch (level.level_type) {
    case "micomiButton":
      return {
        level: {
          level_id: level.level_id,
          level_number: level.level_number,
          level_difficulty: level.level_difficulty,
          level_title: level.level_title,
          level_type: level.level_type,
          content: level.content,
          total_points: totalPoints,
          total_coins: totalCoins,
        },
        energy: energyStatus.energy,
        timeToNextEnergyRestore: energyStatus.timeToNextRestore,
        lessons,
      };

    case "shopButton":
      return {
        level: {
          level_id: level.level_id,
          level_number: level.level_number,
          level_difficulty: level.level_difficulty,
          level_title: level.level_title,
          level_type: level.level_type,
          content: level.content,
          total_points: totalPoints,
          total_coins: totalCoins,
        },
        enemy: null,
        character: null,
        energy: energyStatus.energy,
        timeToNextEnergyRestore: energyStatus.timeToNextRestore,
        player_info: {
          player_id: player.player_id,
          player_coins: player.coins,
        },
        potionShop,
        audio: [
          "https://res.cloudinary.com/dpbocuozx/video/upload/v1760353798/Shop_fjlttd.ogg",
        ],
      };

    case "enemyButton":
    default: {
      let enemy: Enemy | null = null;
      if (level.enemy) {
        enemy = level.enemy;
      } else {
        enemy = await prisma.enemy.findFirst({
          where: {
            enemy_map: level.map.map_name,
            enemy_difficulty: level.level_difficulty,
          },
        });
      }
      if (!enemy) throw new Error("Enemy not found for this level");

      const selectedChar = await prisma.playerCharacter.findFirst({
        where: { player_id: playerId, is_selected: true },
        include: { character: true },
      });
      if (!selectedChar) throw new Error("No character selected");

      const character = selectedChar.character;
      const playerMaxHealth = Number(character.health ?? 0);
      const enemyMaxHealth = getBaseEnemyHp(level);

      return {
        level: {
          level_id: level.level_id,
          level_number: level.level_number,
          level_difficulty: level.level_difficulty,
          level_title: level.level_title,
          level_type: level.level_type,
          content: level.content,
          total_points: totalPoints,
          total_coins: totalCoins,
        },
        enemy: {
          enemy_id: enemy.enemy_id,
          enemy_name: enemy.enemy_name,
          enemy_health: enemyMaxHealth,
          enemy_idle: enemy.enemy_avatar,
          enemy_run: enemy.enemy_run,
          enemy_damage: enemy.enemy_damage,
          enemy_attack: enemy.enemy_attack,
          enemy_special_attack: enemy.special_skill,
          enemy_hurt: enemy.enemy_hurt,
          enemy_dies: enemy.enemy_dies,
          enemy_avatar: enemy.avatar_enemy,
        },
        character: {
          character_id: character.character_id,
          character_name: character.character_name,
          character_health: playerMaxHealth,
          character_damage: character.character_damage,
          character_idle: character.avatar_image,
          character_run: character.character_run,
          character_attack: character.character_attacks,
          character_hurt: character.character_hurt,
          character_dies: character.character_dies,
          character_avatar: character.character_avatar,
        },
        energy: energyStatus.energy,
        timeToNextEnergyRestore: energyStatus.timeToNextRestore,
        audio: [
          "https://res.cloudinary.com/dpbocuozx/video/upload/v1760353796/Navigation_sxwh2g.mp3",
        ],
        bossLevelExpectedOutput: level.boss_level_expected_output,
      };
    }
  }
};

export const enterLevel = async (playerId: number, levelId: number) => {
  const level:
    | (Level & {
        map: any;
        challenges: Challenge[];
        lessons: any;
        potionShopByLevel: any;
        enemy: Enemy | null;
      })
    | null = await prisma.level.findUnique({
    where: { level_id: levelId },
    include: {
      map: true,
      challenges: true,
      lessons: true,
      potionShopByLevel: true,
      enemy: true,
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
    level.challenges = level.challenges;
  } else if (
    level.level_difficulty === "hard" ||
    level.level_difficulty === "final"
  ) {
    const invalid = level.challenges.some(
      (c: Challenge) => c.challenge_type !== "code with guide"
    );
    if (invalid)
      throw new Error("Hard levels can only have 'code with guide' challenges");
    level.challenges = level.challenges;
  }

  let enemy: Enemy | null = null;
  if (level.enemy) {
    enemy = level.enemy;
  } else {
    enemy = await prisma.enemy.findFirst({
      where: {
        enemy_map: level.map.map_name,
        enemy_difficulty: level.level_difficulty,
      },
    });
  }
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
    const previousLevelNumber = level.level_number - 1;
    const previousLevel = await prisma.level.findFirst({
      where: {
        map_id: level.map_id,
        level_number: previousLevelNumber,
      },
    });

    if (previousLevel) {
      const previousProgress = await prisma.playerProgress.findUnique({
        where: {
          player_id_level_id: {
            player_id: playerId,
            level_id: previousLevel.level_id,
          },
        },
      });

      if (!previousProgress || !previousProgress.is_completed) {
        throw new Error("Level not unlocked yet");
      }
    } else {
      console.warn(
        `No previous level found for level ${level.level_number} in map ${level.map_id}`
      );
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
  const enemyMaxHealth = getBaseEnemyHp(level);

  console.log("🔄 ENTERING LEVEL - Health Reset:");
  console.log("- Player max health:", playerMaxHealth);
  console.log("- Enemy max health (scaled):", enemyMaxHealth);

  const existingProgress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
  });

  const isReEnteringCompleted = existingProgress?.is_completed === true;
  const isLostState =
    existingProgress &&
    existingProgress.player_hp <= 0 &&
    !existingProgress.is_completed;

  let progress;
  if (!existingProgress) {
    progress = await prisma.playerProgress.create({
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
        battle_status: BattleStatus.in_progress,
        is_completed: false,
        wrong_challenges: [],
        coins_earned: 0,
        total_points_earned: 0,
        total_exp_points_earned: 0,
        consecutive_corrects: 0,
        consecutive_wrongs: 0,
        has_reversed_curse: false,
        has_boss_shield: false,
        has_force_character_attack_type: false,
        took_damage: false,
        has_strong_effect: false,
        has_freeze_effect: false,
      },
    });
    console.log(`Created new progress for level ${levelId}`);
  } else if (isLostState) {
    progress = await prisma.playerProgress.update({
      where: { progress_id: existingProgress.progress_id },
      data: {
        attempts: 0,
        player_answer: {},
        wrong_challenges: [],
        completed_at: null,
        challenge_start_time: new Date(),
        player_hp: playerMaxHealth,
        enemy_hp: enemyMaxHealth,
        battle_status: BattleStatus.in_progress,
        is_completed: false,
        coins_earned: 0,
        total_points_earned: 0,
        total_exp_points_earned: 0,
        consecutive_corrects: 0,
        consecutive_wrongs: 0,
        has_reversed_curse: false,
        has_boss_shield: false,
        has_force_character_attack_type: false,
        took_damage: false,
        has_strong_effect: false,
        has_freeze_effect: false,
      },
    });
    console.log(`Reset progress for lost state in level ${levelId}`);
  } else if (isReEnteringCompleted) {
    progress = await prisma.playerProgress.update({
      where: { progress_id: existingProgress.progress_id },
      data: {
        attempts: 0,
        player_answer: {},
        wrong_challenges: [],
        player_hp: playerMaxHealth,
        enemy_hp: enemyMaxHealth,
        battle_status: BattleStatus.in_progress,
        challenge_start_time: new Date(),
        consecutive_corrects: 0,
        consecutive_wrongs: 0,
        has_reversed_curse: false,
        has_boss_shield: false,
        has_force_character_attack_type: false,
        took_damage: false,
        has_strong_effect: false,
        has_freeze_effect: false,
        coins_earned: 0,
        total_points_earned: 0,
        total_exp_points_earned: 0,
      },
    });
    console.log(`Reset progress for replay of completed level ${levelId}`);
  } else {
    progress = existingProgress;
    console.log(`Resuming in-progress level ${levelId}`);
  }

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
        timer: formatTimer(timeLimit),
      };
    }
  );

  const firstChallenge = challengesWithTimer[0] ?? null;
  const energyStatus = await EnergyService.getPlayerEnergyStatus(playerId);

  const currentEnemyHealth = progress.enemy_hp ?? enemyMaxHealth;
  const currentPlayerHealth = progress.player_hp ?? playerMaxHealth;

  const correctAnswerLength = Array.isArray(firstChallenge?.correct_answer)
    ? firstChallenge.correct_answer.length
    : 0;

  let character_attack_image = null;

  if (correctAnswerLength >= 8) {
    character_attack_image = //third attack
      "https://res.cloudinary.com/dpbocuozx/image/upload/v1760942688/15cdfe1f-dc78-4f25-a4ae-5cbbc27a4060_jmzqz6.png";
  } else if (correctAnswerLength >= 5 && correctAnswerLength < 8) {
    character_attack_image = //second attack
      "https://res.cloudinary.com/dpbocuozx/image/upload/v1760942690/b86116f4-4c3c-4f9c-bec3-7628482673e8_eh6biu.png";
  } else {
    character_attack_image = //basic attack
      "https://res.cloudinary.com/dpbocuozx/image/upload/v1760942690/Untitled_1024_x_1536_px__20251020_131545_0000_hs8lr4.png";
  }

  const combatBackground = [
    await getBackgroundForLevel(level.map.map_name, level.level_number),
  ];

  return {
    level: {
      level_id: level.level_id,
      level_number: level.level_number,
      level_type: level.level_type,
      level_difficulty: level.level_difficulty,
      level_title: level.level_title,
      content: level.content,
    },
    enemy: {
      enemy_id: enemy.enemy_id,
      enemy_name: enemy.enemy_name,
      enemy_health: currentEnemyHealth,
      enemy_idle: enemy.enemy_avatar,
      enemy_run: enemy.enemy_run,
      enemy_damage: enemy.enemy_damage,
      enemy_attack: enemy.enemy_attack,
      enemy_special_attack: enemy.special_skill,
      enemy_hurt: enemy.enemy_hurt,
      enemy_dies: enemy.enemy_dies,
      enemy_avatar: enemy.avatar_enemy,
    },
    character: {
      character_id: character.character_id,
      character_name: character.character_name,
      character_health: currentPlayerHealth,
      character_damage: character.character_damage,
      character_idle: character.avatar_image,
      character_run: character.character_run,
      character_attack: character.character_attacks,
      character_hurt: character.character_hurt,
      character_dies: character.character_dies,
      character_avatar: character.character_avatar,
    },
    currentChallenge: firstChallenge,
    energy: energyStatus.energy,
    timeToNextEnergyRestore: energyStatus.timeToNextRestore,
    correct_answer_length: correctAnswerLength,
    character_attack_image,
    combat_background: combatBackground,
  };
};

export const unlockNextLevel = async (
  playerId: number,
  mapId: number,
  currentLevelNumber: number
) => {
  const nextLevel = await prisma.level.findFirst({
    where: { map_id: mapId, level_number: currentLevelNumber + 1 },
  });

  if (nextLevel) {
    if (!nextLevel.is_unlocked) {
      await prisma.level.update({
        where: { level_id: nextLevel.level_id },
        data: { is_unlocked: true },
      });
    }

    await prisma.playerProgress.upsert({
      where: {
        player_id_level_id: {
          player_id: playerId,
          level_id: nextLevel.level_id,
        },
      },
      update: {},
      create: {
        player_id: playerId,
        level_id: nextLevel.level_id,
        current_level: nextLevel.level_number,
        attempts: 0,
        player_answer: {},
        challenge_start_time: new Date(),
      },
    });

    await prisma.player.update({
      where: { player_id: playerId },
      data: { level: nextLevel.level_id },
    });

    return nextLevel;
  }

  const currentMap = await prisma.map.findUnique({ where: { map_id: mapId } });
  if (!currentMap) return null;

  const mapProgression: Record<string, string | null> = {
    HTML: "CSS",
    CSS: "JavaScript",
    JavaScript: null,
    Computer: null,
  };

  const nextMapName = mapProgression[currentMap.map_name] ?? null;
  if (!nextMapName) return null;

  const nextMap = await prisma.map.findFirst({
    where: { map_name: nextMapName },
  });
  if (!nextMap) return null;

  if (!nextMap.is_active) {
    await prisma.map.update({
      where: { map_id: nextMap.map_id },
      data: { is_active: true },
    });
  }

  const firstLevel = await prisma.level.findFirst({
    where: { map_id: nextMap.map_id },
    orderBy: { level_number: "asc" },
  });

  if (firstLevel && !firstLevel.is_unlocked) {
    await prisma.level.update({
      where: { level_id: firstLevel.level_id },
      data: { is_unlocked: true },
    });
  }

  console.log(
    `Progressed from ${currentMap.map_name} → ${nextMap.map_name} (unlocked first level)`
  );

  return firstLevel ?? null;
};

export const completeMicomiLevel = async (
  playerId: number,
  levelId: number
) => {
  const level = await prisma.level.findUnique({
    where: { level_id: levelId },
    include: { map: true },
  });

  if (!level) throw new Error("Level not found");
  if (level.level_type !== "micomiButton") {
    throw new Error("This API is only for micomiButton levels");
  }

  const progress = await prisma.playerProgress.upsert({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    update: {
      is_completed: true,
      completed_at: new Date(),
      done_micomi_level: true,
    },
    create: {
      player_id: playerId,
      level_id: levelId,
      current_level: level.level_number,
      attempts: 0,
      player_answer: {},
      completed_at: new Date(),
      challenge_start_time: new Date(),
      is_completed: true,
      done_micomi_level: true,
      player_hp: 0,
      enemy_hp: 0,
      wrong_challenges: [],
    },
  });

  const nextLevel = await unlockNextLevel(
    playerId,
    level.map_id,
    level.level_number
  );

  await updateQuestProgress(playerId, QuestType.complete_lesson, 1);

  return {
    message: "Micomi level completed",
    currentLevel: {
      level_id: level.level_id,
      level_number: level.level_number,
      level_type: level.level_type,
      level_title: level.level_title,
    },
    unlockedNextLevel: nextLevel
      ? {
          level_id: nextLevel.level_id,
          level_number: nextLevel.level_number,
          level_type: nextLevel.level_type,
          level_title: nextLevel.level_title,
        }
      : null,
    progress,
  };
};

export const completeShopLevel = async (playerId: number, levelId: number) => {
  const level = await prisma.level.findUnique({
    where: { level_id: levelId },
    include: { map: true, potionShopByLevel: true },
  });

  if (!level) throw new Error("Level not found");
  if (level.level_type !== "shopButton") {
    throw new Error("This API is only for shopButton levels");
  }

  const potionConfig = level.potionShopByLevel;
  if (!potionConfig) {
    throw new Error("No potion configuration found for this shop level");
  }

  const potions = await prisma.potionShop.findMany();
  const playerLevelPotions = await prisma.playerLevelPotion.findMany({
    where: { player_id: playerId, level_id: levelId },
  });

  const notCompleted = potions.some((p) => {
    const rawLimit =
      potionConfig[
        `${p.potion_type.toLowerCase()}_quantity` as keyof typeof potionConfig
      ] ?? 0;
    const limit = Number(rawLimit ?? 0);
    if (limit <= 0) return false;

    const bought =
      playerLevelPotions.find((plp) => plp.potion_shop_id === p.potion_shop_id)
        ?.quantity ?? 0;

    return bought < limit;
  });

  // if (notCompleted) {
  //   throw new Error(
  //     "Player has not yet bought all limited potions for this level"
  //   );
  // }

  //comment daw kog gamay ingon si Noel :>

  const progress = await prisma.playerProgress.upsert({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    update: {
      is_completed: true,
      completed_at: new Date(),
      done_shop_level: true,
    },
    create: {
      player_id: playerId,
      level_id: levelId,
      current_level: level.level_number,
      attempts: 0,
      player_answer: {},
      completed_at: new Date(),
      challenge_start_time: new Date(),
      is_completed: true,
      done_shop_level: true,
      player_hp: 0,
      enemy_hp: 0,
      wrong_challenges: [],
    },
  });

  const nextLevel = await unlockNextLevel(
    playerId,
    level.map_id,
    level.level_number
  );

  return {
    message: "Shop level completed",
    currentLevel: {
      level_id: level.level_id,
      level_number: level.level_number,
      level_type: level.level_type,
      level_title: level.level_title,
    },
    unlockedNextLevel: nextLevel
      ? {
          level_id: nextLevel.level_id,
          level_number: nextLevel.level_number,
          level_type: nextLevel.level_type,
          level_title: nextLevel.level_title,
        }
      : null,
    progress,
  };
};
