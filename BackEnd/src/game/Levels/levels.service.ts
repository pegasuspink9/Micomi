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
import { getCardForAttackType } from "../Combat/combat.service";

const prisma = new PrismaClient();

const MAP_ORDER = ["HTML", "CSS", "JavaScript", "Computer"] as const;
const MAP_PROGRESSION: Record<
  (typeof MAP_ORDER)[number],
  (typeof MAP_ORDER)[number] | null
> = {
  HTML: "CSS",
  CSS: "JavaScript",
  JavaScript: "Computer",
  Computer: null,
};

export const isMapUnlockedForPlayer = async (
  playerId: number,
  mapName: string
) => {
  if (mapName === "HTML" || mapName === "Computer") return true;

  const currentIndex = MAP_ORDER.indexOf(mapName as (typeof MAP_ORDER)[number]);
  if (currentIndex <= 0) return false;

  const prevMapName = MAP_ORDER[currentIndex - 1];
  const prevMap = await prisma.map.findUnique({
    where: { map_name: prevMapName },
  });
  if (!prevMap) return false;

  const lastLevel = await prisma.level.findFirst({
    where: { map_id: prevMap.map_id },
    orderBy: { level_number: "desc" },
  });
  if (!lastLevel) return false;

  const prevProgress = await prisma.playerProgress.findUnique({
    where: {
      player_id_level_id: { player_id: playerId, level_id: lastLevel.level_id },
    },
    select: { is_completed: true },
  });

  return prevProgress?.is_completed === true;
};

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
          level_number: null,
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
          level_number: null,
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
        audio: "https://micomi-assets.me/Sounds/Final/Shop.ogg",
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
          character_is_range: character.is_range,
          character_range_attack: character.range_attacks,
        },
        energy: energyStatus.energy,
        timeToNextEnergyRestore: energyStatus.timeToNextRestore,
        audio:
          "https://res.cloudinary.com/dpbocuozx/video/upload/v1760353796/Navigation_sxwh2g.mp3",
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

  if (level.level_type === "shopButton") {
    const progress = await prisma.playerProgress.findUnique({
      where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    });

    if (progress?.done_shop_level) {
      throw new Error("Shop level already completed, cannot enter again");
    }
  }

  level.challenges.sort((a, b) => a.challenge_id - b.challenge_id);

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

  if (level.level_type === "micomiButton") {
    const lessons = await prisma.level.findFirst({
      where: { level_id: levelId },
      include: {
        lessons: {
          orderBy: { lesson_id: "asc" },
          select: {
            lesson_id: true,
            page_number: true,
            page_url: true,
          },
        },
      },
    });

    const lessonList = lessons?.lessons ?? [];

    const currentLesson = lessonList[0] ?? null;
    const lastLesson = lessonList.length
      ? lessonList[lessonList.length - 1]
      : null;

    return {
      level: {
        level_id: level.level_id,
        level_number: null,
        level_difficulty: level.level_difficulty,
        level_title: level.level_title,
        level_type: level.level_type,
        content: level.content,
        total_points: totalPoints,
        total_coins: totalCoins,
      },
      currentLesson: currentLesson
        ? {
            lesson_id: currentLesson.lesson_id,
            page_number: currentLesson.page_number,
            page_url: currentLesson.page_url,
          }
        : null,

      lastPage: lastLesson
        ? {
            lesson_id: lastLesson.lesson_id,
            page_number: lastLesson.page_number,
            page_url: lastLesson.page_url,
          }
        : null,

      energy: energyStatus.energy,
      timeToNextEnergyRestore: energyStatus.timeToNextRestore,
      lessons,
    };
  }

  if (level.level_type === "shopButton") {
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

      const potionTypeFieldMap: { [key: string]: string } = {
        Life: "health_quantity",
        Power: "strong_quantity",
        Immunity: "freeze_quantity",
        Reveal: "hint_quantity",
      };

      potionShop = potions
        .map((p) => {
          const globalOwned =
            playerPotions.find((pp) => pp.potion_shop_id === p.potion_shop_id)
              ?.quantity ?? 0;
          const levelBought =
            playerLevelPotions.find(
              (plp) => plp.potion_shop_id === p.potion_shop_id
            )?.quantity ?? 0;

          const fieldName =
            potionTypeFieldMap[p.potion_type] ||
            `${p.potion_type.toLowerCase()}_quantity`;
          const rawLimit =
            potionConfig[fieldName as keyof typeof potionConfig] ?? 0;
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

    return {
      level: {
        level_id: level.level_id,
        level_number: null,
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
      audio: "https://micomi-assets.me/Sounds/Final/Shop.ogg",
    };
  }

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

  let progress: PlayerProgress;
  if (existingProgress) {
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
        has_both_hp_decrease: false,
        has_shuffle_ss: false,
        has_permuted_ss: false,
        took_damage: false,
        has_strong_effect: false,
        has_freeze_effect: false,
      },
    });
    console.log(`Reset progress for level ${levelId} - fresh start`);
  } else {
    if (level.level_id === firstLevel?.level_id) {
      const mapUnlocked = await isMapUnlockedForPlayer(
        playerId,
        level.map.map_name
      );
      if (!mapUnlocked) {
        throw new Error("Map not unlocked yet for this player");
      }
    } else {
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
          select: { is_completed: true },
        });

        if (!previousProgress || !previousProgress.is_completed) {
          throw new Error("Previous level not completed yet for this player");
        }
      } else {
        console.warn(
          `No previous level found for level ${level.level_number} in map ${level.map_id}`
        );
      }
    }

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
        has_both_hp_decrease: false,
        has_shuffle_ss: false,
        has_permuted_ss: false,
        took_damage: false,
        has_strong_effect: false,
        has_freeze_effect: false,
        ...(level.level_type === "shopButton"
          ? { done_shop_level: false }
          : {}),
        ...(level.level_type === "micomiButton"
          ? { done_micomi_level: false }
          : {}),
      },
    });
    console.log(
      `Created new player-specific progress (unlocked) for level ${levelId}`
    );
  }

  const isReEnteringCompleted = progress.is_completed === true;
  const isLostState = progress.player_hp <= 0 && !progress.is_completed;

  if (isLostState) {
    progress = await prisma.playerProgress.update({
      where: { progress_id: progress.progress_id },
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
        has_both_hp_decrease: false,
        has_shuffle_ss: false,
        has_permuted_ss: false,
        took_damage: false,
        has_strong_effect: false,
        has_freeze_effect: false,
      },
    });
    console.log(`Reset progress for lost state in level ${levelId}`);
  } else if (isReEnteringCompleted) {
    progress = await prisma.playerProgress.update({
      where: { progress_id: progress.progress_id },
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
        has_both_hp_decrease: false,
        has_permuted_ss: false,
        has_shuffle_ss: false,
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

  const currentEnemyHealth = progress.enemy_hp ?? enemyMaxHealth;
  const currentPlayerHealth = progress.player_hp ?? playerMaxHealth;

  const correctAnswerLength = Array.isArray(firstChallenge?.correct_answer)
    ? firstChallenge.correct_answer.length
    : 0;

  let card_type: string | null = null;
  let character_attack_card: string | null = null;
  let character_damage_card: number | null = null;

  let attackType: string;
  if (correctAnswerLength >= 8) {
    attackType = "third_attack";
    character_damage_card = character.character_damage[2];
  } else if (correctAnswerLength >= 5) {
    attackType = "second_attack";
    character_damage_card = character.character_damage[1];
  } else {
    attackType = "basic_attack";
    character_damage_card = character.character_damage[0];
  }

  const cardInfo = getCardForAttackType(character.character_name, attackType);
  card_type = cardInfo.card_type;
  character_attack_card = cardInfo.character_attack_card;

  const combatBackground = [
    await getBackgroundForLevel(level.map.map_name, level.level_number),
  ];

  const questionType = level.map.map_name;

  const versus_background_audio =
    "https://micomi-assets.me/Sounds/Final/Versus%20Sound%20Effect%20Final.wav";

  let versus_background = "";
  let gameplay_audio = "";

  switch (questionType) {
    case "HTML":
      versus_background = "https://micomi-assets.me/Versus%20Maps/Green.png";
      if (level.level_type === "bossButton") {
        gameplay_audio = "https://micomi-assets.me/Sounds/Final/Boss.ogg";
      } else {
        gameplay_audio =
          "https://micomi-assets.me/Sounds/Final/Greenland%20Final.mp3";
      }
      break;
    case "CSS":
      versus_background = "https://micomi-assets.me/Versus%20Maps/Lava.png";
      if (level.level_type === "bossButton") {
        gameplay_audio = "https://micomi-assets.me/Sounds/Final/Boss.ogg";
      } else {
        gameplay_audio = "https://micomi-assets.me/Sounds/Final/Lavaland.mp3";
      }
      break;
    case "JavaScript":
      versus_background = "https://micomi-assets.me/Sounds/Final/Snowland.mp3";
      if (level.level_type === "bossButton") {
        gameplay_audio = "https://micomi-assets.me/Sounds/Final/Boss.ogg";
      } else {
        gameplay_audio = "https://micomi-assets.me/Sounds/Final/Snowland.mp3";
      }
      break;
    case "Computer":
      versus_background =
        "https://micomi-assets.me/Sounds/Final/Autumnland.mp3";
      if (level.level_type === "bossButton") {
        gameplay_audio = "https://micomi-assets.me/Sounds/Final/Boss.ogg";
      } else {
        gameplay_audio = "https://micomi-assets.me/Sounds/Final/Autumnland.mp3";
      }
  }

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
      character_is_range: character.is_range,
      character_attack_pose: character.attack_pose,
      character_range_attack: character.range_attacks,
    },
    card: {
      card_type,
      character_attack_card,
      character_damage_card,
    },
    currentChallenge: firstChallenge,
    energy: energyStatus.energy,
    timeToNextEnergyRestore: energyStatus.timeToNextRestore,
    correct_answer_length: correctAnswerLength,
    combat_background: combatBackground,
    question_type: questionType,
    versus_background: versus_background,
    versus_audio: versus_background_audio,
    gameplay_audio: gameplay_audio,
  };
};

export const unlockNextLevel = async (
  playerId: number,
  mapId: number,
  currentLevelId: number
) => {
  const currentLevel = await prisma.level.findFirst({
    where: { map_id: mapId, level_id: currentLevelId },
  });

  if (!currentLevel) {
    throw new Error("Current level not found");
  }

  const nextLevel = await prisma.level.findFirst({
    where: {
      map_id: mapId,
      level_id: { gt: currentLevel.level_id },
    },
    orderBy: { level_id: "asc" },
  });

  if (nextLevel) {
    const isMicomiLevel = nextLevel.level_type === "micomiButton";

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
        completed_at: isMicomiLevel ? new Date() : null,
        challenge_start_time: new Date(),
        player_hp: 0,
        enemy_hp: 0,
        battle_status: BattleStatus.in_progress,
        is_completed: isMicomiLevel,
        wrong_challenges: [],
        coins_earned: 0,
        total_points_earned: 0,
        total_exp_points_earned: 0,
        consecutive_corrects: 0,
        consecutive_wrongs: 0,
        has_reversed_curse: false,
        has_boss_shield: false,
        has_force_character_attack_type: false,
        has_both_hp_decrease: false,
        has_permuted_ss: false,
        has_shuffle_ss: false,
        took_damage: false,
        has_strong_effect: false,
        has_freeze_effect: false,
        ...(nextLevel.level_type === "shopButton"
          ? { done_shop_level: false }
          : {}),
        ...(nextLevel.level_type === "micomiButton"
          ? { done_micomi_level: true }
          : {}),
      },
    });

    if (isMicomiLevel) {
      console.log(
        `Auto-completed micomi level ${nextLevel.level_id}, unlocking next level...`
      );

      const levelAfterMicomi = await prisma.level.findFirst({
        where: {
          map_id: mapId,
          level_id: { gt: nextLevel.level_id },
        },
        orderBy: { level_id: "asc" },
      });

      if (levelAfterMicomi) {
        await prisma.playerProgress.upsert({
          where: {
            player_id_level_id: {
              player_id: playerId,
              level_id: levelAfterMicomi.level_id,
            },
          },
          update: {},
          create: {
            player_id: playerId,
            level_id: levelAfterMicomi.level_id,
            current_level: levelAfterMicomi.level_number,
            attempts: 0,
            player_answer: {},
            completed_at: null,
            challenge_start_time: new Date(),
            player_hp: 0,
            enemy_hp: 0,
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
            has_both_hp_decrease: false,
            has_permuted_ss: false,
            has_shuffle_ss: false,
            took_damage: false,
            has_strong_effect: false,
            has_freeze_effect: false,
            ...(levelAfterMicomi.level_type === "shopButton"
              ? { done_shop_level: false }
              : {}),
            ...(levelAfterMicomi.level_type === "micomiButton"
              ? { done_micomi_level: false }
              : {}),
          },
        });

        console.log(
          `Unlocked level ${levelAfterMicomi.level_id} after auto-completed micomi level`
        );
      }
    }

    return nextLevel;
  }

  const currentMap = await prisma.map.findUnique({ where: { map_id: mapId } });
  if (!currentMap) return null;

  const nextMapName =
    MAP_PROGRESSION[currentMap.map_name as (typeof MAP_ORDER)[number]];
  if (!nextMapName) return null;

  const nextMap = await prisma.map.findUnique({
    where: { map_name: nextMapName },
  });
  if (!nextMap) return null;

  const firstLevel = await prisma.level.findFirst({
    where: { map_id: nextMap.map_id },
    orderBy: { level_number: "asc" },
  });

  if (firstLevel) {
    await prisma.playerProgress.upsert({
      where: {
        player_id_level_id: {
          player_id: playerId,
          level_id: firstLevel.level_id,
        },
      },
      update: {},
      create: {
        player_id: playerId,
        level_id: firstLevel.level_id,
        current_level: firstLevel.level_number,
        attempts: 0,
        player_answer: {},
        completed_at: null,
        challenge_start_time: new Date(),
        player_hp: 0,
        enemy_hp: 0,
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
        has_both_hp_decrease: false,
        has_permuted_ss: false,
        has_shuffle_ss: false,
        took_damage: false,
        has_strong_effect: false,
        has_freeze_effect: false,
        ...(firstLevel.level_type === "shopButton"
          ? { done_shop_level: false }
          : {}),
        ...(firstLevel.level_type === "micomiButton"
          ? { done_micomi_level: false }
          : {}),
      },
    });

    console.log(
      `Player ${playerId} progressed from ${currentMap.map_name} → ${nextMapName} (unlocked first level player-specifically)`
    );

    return firstLevel;
  }

  return null;
};

export const completeLevelDone = async (playerId: number, levelId: number) => {
  const level = await prisma.level.findUnique({
    where: { level_id: levelId },
    include: { map: true, potionShopByLevel: true },
  });

  if (!level) throw new Error("Level not found");

  const isMicomiLevel = level.level_type === "micomiButton";
  const isShopLevel = level.level_type === "shopButton";

  if (!isMicomiLevel && !isShopLevel) {
    throw new Error(
      "This endpoint only supports micomiButton and shopButton levels"
    );
  }

  if (isShopLevel) {
    const potionConfig = level.potionShopByLevel;
    if (potionConfig) {
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
          playerLevelPotions.find(
            (plp) => plp.potion_shop_id === p.potion_shop_id
          )?.quantity ?? 0;

        return bought < limit;
      });

      // Uncomment this if you want to enforce buying all potions
      // if (notCompleted) {
      //   throw new Error("You must buy all available potions before completing the shop level");
      // }
    }
  }

  const existingProgress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
  });

  const wasAlreadyCompleted = existingProgress?.is_completed === true;

  const progress = await prisma.playerProgress.upsert({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    update: {
      is_completed: true,
      completed_at: new Date(),
      ...(isMicomiLevel && { done_micomi_level: true }),
      ...(isShopLevel && { done_shop_level: true }),
    },
    create: {
      player_id: playerId,
      level_id: levelId,
      current_level: level.level_number,
      is_completed: true,
      completed_at: new Date(),
      challenge_start_time: new Date(),
      player_hp: 0,
      enemy_hp: 0,
      battle_status: BattleStatus.in_progress,
      coins_earned: 0,
      total_points_earned: 0,
      total_exp_points_earned: 0,
      wrong_challenges: [],
      attempts: 0,
      player_answer: {},
      consecutive_corrects: 0,
      consecutive_wrongs: 0,
      has_reversed_curse: false,
      has_boss_shield: false,
      has_force_character_attack_type: false,
      has_both_hp_decrease: false,
      has_permuted_ss: false,
      has_shuffle_ss: false,
      took_damage: false,
      has_strong_effect: false,
      has_freeze_effect: false,
      ...(isMicomiLevel ? { done_micomi_level: true } : {}),
      ...(isShopLevel ? { done_shop_level: true } : {}),
    },
  });

  const nextLevel = await unlockNextLevel(
    playerId,
    level.map_id,
    level.level_number
  );

  if (!wasAlreadyCompleted && isMicomiLevel) {
    await updateQuestProgress(playerId, QuestType.complete_lesson, 1);
  }

  return {
    message: `${
      isMicomiLevel ? "Micomi" : "Shop"
    } level completed successfully`,
    level_type: level.level_type,
    currentLevel: {
      level_id: level.level_id,
      level_number: level.level_number,
      level_type: level.level_type,
      level_title: level.level_title,
    },
    nextLevel: nextLevel
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
