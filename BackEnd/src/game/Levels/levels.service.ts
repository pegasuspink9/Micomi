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
  mapName: string,
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
      lessons: true,
      enemy: true,
    },
  })) as
    | (Level & {
        map: any;
        challenges: Challenge[];
        lessons: any;
        enemy: Enemy | null;
      })
    | null;
  if (!level) throw new Error("Level not found");

  const totalPoints = level.challenges.reduce(
    (sum, ch) => sum + Number(ch.points_reward ?? 0),
    0,
  );
  const totalCoins = level.challenges.reduce(
    (sum, ch) => sum + Number(ch.coins_reward ?? 0),
    0,
  );

  const energyStatus = await EnergyService.getPlayerEnergyStatus(playerId);
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!player) throw new Error("Player not found");

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

const SS_HERO_ICON_CONFIG: Record<
  string,
  { special_skill_image: string; special_skill_description: string }
> = {
  Gino: {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/Gino_SS.png",
    special_skill_description:
      "Unleashes a powerful lightning attack and heals 25% HP",
  },
  ShiShi: {
    special_skill_image: "SS icon skill ni ShiShi",
    special_skill_description:
      "Freezes the enemy, preventing their next attack",
  },
  Ryron: {
    special_skill_image: "SS icon skill ni Ryron",
    special_skill_description:
      "God's Judgment: Reveals all blanks in the next challenge",
  },
  Leon: {
    special_skill_image: "SS icon skill ni Leon",
    special_skill_description: "Deals 2x damage with a devastating fire attack",
  },
};

const SS_BOSS_ICON_CONFIG: Record<
  string,
  {
    special_skill_image: string;
    special_skill_description: string;
    ss_type: string;
  }
> = {
  "Boss Joshy": {
    special_skill_image: "SS icon skill ni Boss Joshy",
    special_skill_description: "Blocks all damage for one turn",
    ss_type: "shield",
  },
  "King Grimnir": {
    special_skill_image: "SS icon skill ni King Grimnir",
    special_skill_description: "Forces player to use only basic attacks",
    ss_type: "force_basic_attack",
  },
  "Boss Darco": {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/BossDarko_SS.png",
    special_skill_description: "Reverses all text in the challenge",
    ss_type: "reverse",
  },
  "Boss Scorcharach": {
    special_skill_image: "SS icon skill ni Boss Scorcharach",
    special_skill_description: "Both the hero and the boss take damage",
    ss_type: "mutual_damage",
  },
  "Boss Maggmaw": {
    special_skill_image: "SS icon skill ni Boss Maggmaw",
    special_skill_description: "Randomly shuffles all answer options",
    ss_type: "shuffle",
  },
  "Boss Pyroformic": {
    special_skill_image: "SS icon skill ni Boss Pyroformic",
    special_skill_description: "Scrambles letters within each option",
    ss_type: "permuted",
  },
};

function getHeroSpecialSkillInfo(
  characterName: string,
  streak?: number,
): {
  special_skill_image: string | null;
  special_skill_description: string | null;
  streak: number;
} {
  const safeStreak = streak ?? 0;
  const config = SS_HERO_ICON_CONFIG[characterName];
  if (!config) {
    return {
      special_skill_image: null,
      special_skill_description: null,
      streak: safeStreak,
    };
  }

  return {
    special_skill_image: config.special_skill_image,
    special_skill_description: config.special_skill_description,
    streak: safeStreak,
  };
}

function getBossSpecialSkillInfo(
  enemyName: string,
  ssType: string | null,
  streak?: number,
): {
  special_skill_image: string | null;
  special_skill_description: string | null;
  streak: number;
  ss_type: string | null;
} {
  const safeStreak = streak ?? 0;
  const config = SS_BOSS_ICON_CONFIG[enemyName];
  if (!config) {
    return {
      special_skill_image: null,
      special_skill_description: null,
      streak: safeStreak,
      ss_type: ssType,
    };
  }

  return {
    special_skill_image: config.special_skill_image,
    special_skill_description: config.special_skill_description,
    streak: safeStreak,
    ss_type: ssType,
  };
}

const MICOMI_AVATAR = "https://micomi-assets.me/Hero%20Portraits/Micomi.png";

export const enterLevel = async (playerId: number, levelId: number) => {
  const level:
    | (Level & {
        map: any;
        challenges: Challenge[];
        lessons: any;
        enemy: Enemy | null;
        dialogue: {
          dialogue_id: number;
          level_id: number;
          script: string | null;
        }[];
      })
    | null = await prisma.level.findUnique({
    where: { level_id: levelId },
    include: {
      map: true,
      challenges: true,
      lessons: true,
      enemy: true,
      dialogue: true,
    },
  });

  if (!level) throw new Error("Level not found");

  level.challenges.sort((a, b) => a.challenge_id - b.challenge_id);

  const totalPoints = level.challenges.reduce(
    (sum, ch) => sum + Number(ch.points_reward ?? 0),
    0,
  );
  const totalCoins = level.challenges.reduce(
    (sum, ch) => sum + Number(ch.coins_reward ?? 0),
    0,
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
      dialogue: [],
    };
  }

  if (level.level_difficulty === "easy") {
    const invalid = level.challenges.some(
      (c: Challenge) =>
        c.challenge_type !== "multiple choice" &&
        c.challenge_type !== "fill in the blank",
    );
    if (invalid)
      throw new Error(
        "Easy levels can only have 'multiple choice' or 'fill in the blank' challenges",
      );
    level.challenges = level.challenges;
  } else if (
    level.level_difficulty === "hard" ||
    level.level_difficulty === "final"
  ) {
    const invalid = level.challenges.some(
      (c: Challenge) => c.challenge_type !== "code with guide",
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
      `No enemy found for map ${level.map.map_name} and difficulty ${level.level_difficulty}`,
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
        wrong_challenges_count: 0,
        has_reversed_curse: false,
        has_boss_shield: false,
        has_force_character_attack_type: false,
        has_both_hp_decrease: false,
        has_shuffle_ss: false,
        has_permuted_ss: false,
        has_dollar_sign_ss: false,
        has_only_blanks_ss: false,
        has_reverse_words_ss: false,
        boss_skill_activated: false,
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
        level.map.map_name,
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
          `No previous level found for level ${level.level_number} in map ${level.map_id}`,
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
        wrong_challenges_count: 0,
        has_reversed_curse: false,
        has_boss_shield: false,
        has_force_character_attack_type: false,
        has_both_hp_decrease: false,
        has_shuffle_ss: false,
        has_permuted_ss: false,
        has_dollar_sign_ss: false,
        has_only_blanks_ss: false,
        has_reverse_words_ss: false,
        boss_skill_activated: false,
        took_damage: false,
        has_strong_effect: false,
        has_freeze_effect: false,
        ...(level.level_type === "micomiButton"
          ? { done_micomi_level: false }
          : {}),
      },
    });
    console.log(
      `Created new player-specific progress (unlocked) for level ${levelId}`,
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
        wrong_challenges_count: 0,
        has_reversed_curse: false,
        has_boss_shield: false,
        has_force_character_attack_type: false,
        has_both_hp_decrease: false,
        has_shuffle_ss: false,
        has_permuted_ss: false,
        has_dollar_sign_ss: false,
        has_only_blanks_ss: false,
        has_reverse_words_ss: false,
        boss_skill_activated: false,
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
        wrong_challenges_count: 0,
        has_reversed_curse: false,
        has_boss_shield: false,
        has_force_character_attack_type: false,
        has_both_hp_decrease: false,
        has_permuted_ss: false,
        has_dollar_sign_ss: false,
        has_only_blanks_ss: false,
        has_reverse_words_ss: false,
        boss_skill_activated: false,
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
    },
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

  const heroSS = getHeroSpecialSkillInfo(
    character.character_name,
    progress.consecutive_corrects,
  );
  const bossSS = getBossSpecialSkillInfo(
    enemy.enemy_name,
    null,
    progress.consecutive_wrongs,
  );

  let dialogue: any = [];
  if (level.dialogue.length > 0) {
    const rawScript = level.dialogue[0].script ?? "";

    const lines = rawScript
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const dialoguePairs: { speaker: string; text: string }[] = [];
    for (const line of lines) {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) continue;
      const speaker = line.slice(0, separatorIndex).trim();
      const text = line.slice(separatorIndex + 1).trim();
      dialoguePairs.push({ speaker, text });
    }

    const scriptArray: Record<string, string>[] = dialoguePairs.map((pair) => ({
      [pair.speaker]: pair.text,
    }));

    dialogue = {
      dialogue_id: level.dialogue[0].dialogue_id,
      level_id: level.dialogue[0].level_id,
      character_name: character.character_name,
      micomi_image: MICOMI_AVATAR,
      enemy_name: enemy.enemy_name,
      enemy_image: enemy.avatar_enemy ?? "",
      script: scriptArray,
    };
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
      special_skill: {
        special_skill_image: bossSS.special_skill_image,
        streak: progress.consecutive_wrongs,
        special_skill_description: bossSS.special_skill_description,
        ss_type: bossSS.ss_type,
      },
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
      special_skill: {
        special_skill_image: heroSS.special_skill_image,
        streak: progress.consecutive_corrects,
        special_skill_description: heroSS.special_skill_description,
      },
    },
    card: {
      card_type,
      character_attack_card,
      character_damage_card,
    },
    dialogue,
    currentChallenge: firstChallenge,
    energy: energyStatus.energy,
    timeToNextEnergyRestore: energyStatus.timeToNextRestore,
    correct_answer_length: correctAnswerLength,
    combat_background: combatBackground,
    question_type: questionType,
    versus_background: versus_background,
    versus_audio: versus_background_audio,
    gameplay_audio: gameplay_audio,
    boss_skill_activated: progress.boss_skill_activated,
    isEnemyFrozen: progress.has_freeze_effect,
  };
};

const unlockNextMapFirstLevel = async (
  playerId: number,
  currentMapId: number,
) => {
  const currentMap = await prisma.map.findUnique({
    where: { map_id: currentMapId },
  });
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
    const isMicomiNext =
      firstLevel.level_type === "micomiButton" ||
      firstLevel.level_type === "final";

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
        wrong_challenges_count: 0,
        has_reversed_curse: false,
        has_boss_shield: false,
        has_force_character_attack_type: false,
        has_both_hp_decrease: false,
        has_permuted_ss: false,
        has_dollar_sign_ss: false,
        has_only_blanks_ss: false,
        has_reverse_words_ss: false,
        boss_skill_activated: false,
        has_shuffle_ss: false,
        took_damage: false,
        has_strong_effect: false,
        has_freeze_effect: false,
        ...(isMicomiNext ? { done_micomi_level: false } : {}),
      },
    });

    console.log(
      `Player ${playerId} progressed from ${currentMap.map_name} → ${nextMapName} (Map Transition)`,
    );

    return firstLevel;
  }

  return null;
};

export const unlockNextLevel = async (
  playerId: number,
  mapId: number,
  currentLevelId: number,
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
    const isMicomiOrFinal =
      nextLevel.level_type === "micomiButton" ||
      nextLevel.level_type === "final";

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
        completed_at: isMicomiOrFinal ? new Date() : null,
        challenge_start_time: new Date(),
        player_hp: 0,
        enemy_hp: 0,
        battle_status: BattleStatus.in_progress,
        is_completed: isMicomiOrFinal,
        wrong_challenges: [],
        coins_earned: 0,
        total_points_earned: 0,
        total_exp_points_earned: 0,
        consecutive_corrects: 0,
        consecutive_wrongs: 0,
        wrong_challenges_count: 0,
        has_reversed_curse: false,
        has_boss_shield: false,
        has_force_character_attack_type: false,
        has_both_hp_decrease: false,
        has_permuted_ss: false,
        has_dollar_sign_ss: false,
        has_only_blanks_ss: false,
        has_reverse_words_ss: false,
        boss_skill_activated: false,
        has_shuffle_ss: false,
        took_damage: false,
        has_strong_effect: false,
        has_freeze_effect: false,
        ...(isMicomiOrFinal ? { done_micomi_level: true } : {}),
      },
    });

    if (isMicomiOrFinal) {
      console.log(
        `Auto-completed level ${nextLevel.level_id} (${nextLevel.level_type}). Checking for next step...`,
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
            wrong_challenges_count: 0,
            has_reversed_curse: false,
            has_boss_shield: false,
            has_force_character_attack_type: false,
            has_both_hp_decrease: false,
            has_permuted_ss: false,
            has_dollar_sign_ss: false,
            has_only_blanks_ss: false,
            has_reverse_words_ss: false,
            boss_skill_activated: false,
            has_shuffle_ss: false,
            took_damage: false,
            has_strong_effect: false,
            has_freeze_effect: false,
            ...(levelAfterMicomi.level_type === "micomiButton"
              ? { done_micomi_level: false }
              : {}),
          },
        });
        return levelAfterMicomi;
      } else {
        console.log("Micomi/Final was the last level. Unlocking next map.");
        return await unlockNextMapFirstLevel(playerId, mapId);
      }
    }

    return nextLevel;
  }

  return await unlockNextMapFirstLevel(playerId, mapId);
};

export const completeLevelDone = async (playerId: number, levelId: number) => {
  const level = await prisma.level.findUnique({
    where: { level_id: levelId },
    include: { map: true },
  });

  if (!level) throw new Error("Level not found");

  const isMicomiLevel = level.level_type === "micomiButton";

  if (!isMicomiLevel) {
    throw new Error("This endpoint only supports micomiButton");
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
      wrong_challenges_count: 0,
      has_reversed_curse: false,
      has_boss_shield: false,
      has_force_character_attack_type: false,
      has_both_hp_decrease: false,
      has_permuted_ss: false,
      has_dollar_sign_ss: false,
      has_only_blanks_ss: false,
      has_reverse_words_ss: false,
      boss_skill_activated: false,
      has_shuffle_ss: false,
      took_damage: false,
      has_strong_effect: false,
      has_freeze_effect: false,
      ...(isMicomiLevel ? { done_micomi_level: true } : {}),
    },
  });

  const nextLevel = await unlockNextLevel(
    playerId,
    level.map_id,
    level.level_number,
  );

  if (!wasAlreadyCompleted && isMicomiLevel) {
    await updateQuestProgress(playerId, QuestType.complete_lesson, 1);
  }

  return {
    message: `${isMicomiLevel} level completed successfully`,
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
