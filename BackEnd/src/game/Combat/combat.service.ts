import { prisma } from "../../../prisma/client";
import { BattleStatus, PotionType, QuestType } from "@prisma/client";
import * as EnergyService from "../Energy/energy.service";
import * as LevelService from "../Levels/levels.service";
import { updateQuestProgress } from "../Quests/quests.service";
import { grantRewards } from "../../../utils/grantRewards";
import { getBackgroundForLevel } from "../../../helper/combatBackgroundHelper";

const ENEMY_HEALTH = 30;
const BOSS_ENEMY_HEALTH = 30;

const CARD_CONFIG: Record<
  string,
  {
    special_attack: { card_type: string; character_attack_card: string };
    third_attack: { card_type: string; character_attack_card: string };
    second_attack: { card_type: string; character_attack_card: string };
    basic_attack: { card_type: string; character_attack_card: string };
  }
> = {
  Gino: {
    special_attack: {
      card_type: "Stormfang Surge",
      character_attack_card:
        "https://micomi-assets.me/Icons/Skill%20Icons/4th.png",
    },
    third_attack: {
      card_type: "Feral Slash",
      character_attack_card:
        "https://micomi-assets.me/Icons/Skill%20Icons/3rd.png",
    },
    second_attack: {
      card_type: "Ruthless Fang",
      character_attack_card:
        "https://micomi-assets.me/Icons/Skill%20Icons/2nd.png",
    },
    basic_attack: {
      card_type: "Wild Claw",
      character_attack_card:
        "https://micomi-assets.me/Icons/Skill%20Icons/1st.png",
    },
  },
  ShiShi: {
    special_attack: {
      card_type: "Icebound Meteoclaw",
      character_attack_card:
        "https://micomi-assets.me/Icons/Skill%20Icons/Special%20Attack%20Card.png",
    },
    third_attack: {
      card_type: "Sparkclaw Cascade",
      character_attack_card:
        "https://micomi-assets.me/Icons/Skill%20Icons/Third%20Attack%20Card.png",
    },
    second_attack: {
      card_type: "Flamewhisker Crash",
      character_attack_card:
        "https://micomi-assets.me/Icons/Skill%20Icons/Second%20Attack%20Card.png",
    },
    basic_attack: {
      card_type: "Voidflare Drop",
      character_attack_card:
        "https://micomi-assets.me/Icons/Skill%20Icons/Basic%20Attack%20Card.png",
    },
  },
  Ryron: {
    special_attack: {
      card_type: "God’s Judgment",
      character_attack_card:
        "https://micomi-assets.me/Icons/Skill%20Icons/Ryron%20Ult.png",
    },
    third_attack: {
      card_type: "Ether Lance",
      character_attack_card:
        "https://micomi-assets.me/Icons/Skill%20Icons/Ryron%20Special.png",
    },
    second_attack: {
      card_type: "Void Piercer",
      character_attack_card:
        "https://micomi-assets.me/Icons/Skill%20Icons/Ryron%202nd.png",
    },
    basic_attack: {
      card_type: "Velocity Shot",
      character_attack_card:
        "https://micomi-assets.me/Icons/Skill%20Icons/Ryron%20Basic.png",
    },
  },
  Leon: {
    special_attack: {
      card_type: "Inferno Bulwark",
      character_attack_card:
        "https://micomi-assets.me/Icons/Skill%20Icons/Leon%20Ult.png",
    },
    third_attack: {
      card_type: "Cataclysm Break",
      character_attack_card:
        "https://micomi-assets.me/Icons/Skill%20Icons/Leon%20Special.png",
    },
    second_attack: {
      card_type: "Molten Strike",
      character_attack_card:
        "https://micomi-assets.me/Icons/Skill%20Icons/Leon%20Basic%20Final.png",
    },
    basic_attack: {
      card_type: "Thunderbound Cleaver",
      character_attack_card:
        "https://micomi-assets.me/Icons/Skill%20Icons/Leon%202nd%20Final.png",
    },
  },
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
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/Shi_SS_FINAL.png",
    special_skill_description:
      "Freezes the enemy, preventing their next attack",
  },
  Ryron: {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/Ryron_SS.png",
    special_skill_description:
      "God's Judgment: Reveals all blanks in the next challenge",
  },
  Leon: {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/Leon_SS.png",
    special_skill_description: "Deals 2x damage with a devastating fire attack",
  },
};

const SS_BOSS_ICON_CONFIG: Record<
  string,
  { special_skill_image: string; special_skill_description: string }
> = {
  "Boss Joshy": {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/BossJoshy_SS.png",
    special_skill_description: "Blocks all damage for one turn",
  },
  "King Grimnir": {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/KingGrimnir_SS.png",
    special_skill_description: "Forces player to use only basic attacks",
  },
  "Boss Darco": {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/BossDarko_SS.png",
    special_skill_description: "Reverses the text of answer options",
  },
  "Boss Antcool": {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/BossAntcool_SS.png",
    special_skill_description: "Reverses the text of answer options",
  },
  "Boss Scorcharach": {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/BossScorarach_SS.pngh",
    special_skill_description: "Both the hero and the boss take damage",
  },
  "Boss Maggmaw": {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/BossMaggmaw_SS.png",
    special_skill_description: "Randomly shuffles all answer options",
  },
  "Boss Pyroformic": {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/BossPyroformic_SS.png",
    special_skill_description: "Scrambles letters within each option",
  },
  "King Feanaly": {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/KingFeanaly_SS.png",
    special_skill_description:
      "Visually hides all text in the question except for the blanks.",
  },
  "Boss Icycreamero": {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/BossIcreamero_SS.png",
    special_skill_description:
      "Replaces one random letter in every answer option with a '$' symbol.",
  },
  "Boss Scythe": {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/LordCyroScythe_SS.png",
    special_skill_description:
      "Reverses 3 random words within the challenge question.",
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

export function getBaseEnemyHp(level: {
  level_difficulty: string;
  challenges?: any[];
}) {
  const isBoss =
    level.level_difficulty === "hard" || level.level_difficulty === "final";
  const base = isBoss ? BOSS_ENEMY_HEALTH : ENEMY_HEALTH;
  return base * (level.challenges?.length ?? 1);
}

const safeHp = (hp: number | null | undefined, fallbackMax: number) =>
  typeof hp === "number" && !Number.isNaN(hp)
    ? Math.max(hp, 0)
    : Math.max(fallbackMax, 0);

const resolveAttackFromType = (params: {
  characterName: string;
  attackType: string;
  correctAnswerLength: number;
  damageArray: number[];
  attacksArray: string[];
  rangeAttacksArray: string[];
  runArray: string[];
  isFinalBonusSpecial: boolean;
}) => {
  const damageIndexForSpecial =
    params.correctAnswerLength >= 8
      ? 2
      : params.correctAnswerLength >= 5
        ? 1
        : 0;

  const damageIndex =
    params.attackType === "third_attack"
      ? 2
      : params.attackType === "second_attack"
        ? 1
        : params.attackType === "basic_attack"
          ? 0
          : damageIndexForSpecial;

  const attackIndex = params.attackType === "special_attack" ? 3 : damageIndex;

  const cardInfo = getCardForAttackType(
    params.characterName,
    params.attackType,
    params.isFinalBonusSpecial,
  );

  let character_run = params.runArray[attackIndex] || null;
  if (params.characterName === "ShiShi" || params.characterName === "Ryron") {
    character_run = null;
  }

  return {
    card_type: cardInfo.card_type,
    character_attack_card: cardInfo.character_attack_card,
    damage: params.damageArray[damageIndex] ?? 10,
    character_attack: params.attacksArray[attackIndex] || null,
    character_range_attack: params.rangeAttacksArray[attackIndex] || null,
    character_run,
  };
};

export function getCardForAttackType(
  characterName: string,
  attackType: string,
  isNormalFinalBonus: boolean = false,
): { card_type: string | null; character_attack_card: string | null } {
  const config = CARD_CONFIG[characterName];
  if (!config || !config[attackType as keyof typeof config]) {
    console.warn(`No card config found for ${characterName} + ${attackType}`);
    return { card_type: null, character_attack_card: null };
  }

  let info = config[attackType as keyof typeof config];
  if (attackType === "special_attack" && isNormalFinalBonus) {
    info = {
      ...info,
      character_attack_card: "no card for special finale attack",
    };
  }
  return info;
}

export async function getFightSetup(playerId: number, levelId: number) {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
    include: {
      ownedCharacters: {
        where: { is_selected: true, is_purchased: true },
        include: { character: true },
      },
    },
  });
  if (!player) throw new Error("Player not found");

  const selectedCharacter = player.ownedCharacters[0]?.character;
  if (!selectedCharacter) throw new Error("No selected character found");

  const level = await prisma.level.findUnique({
    where: { level_id: levelId },
    include: { challenges: true, enemy: true, map: true },
  });
  if (!level) throw new Error("Level not found");
  if (!level.enemy) throw new Error("No enemy assigned to this level");

  const enemy = level.enemy;

  const effectiveEnemyHp = getBaseEnemyHp(level);

  let progress = await prisma.playerProgress.findUnique({
    where: {
      player_id_level_id: { player_id: playerId, level_id: level.level_id },
    },
  });

  if (!progress) {
    progress = await prisma.playerProgress.create({
      data: {
        player_id: playerId,
        level_id: level.level_id,
        current_level: level.level_id,
        attempts: 0,
        player_answer: [],
        wrong_challenges: [],
        enemy_hp: effectiveEnemyHp,
        player_hp: selectedCharacter.health,
        battle_status: BattleStatus.in_progress,
        challenge_start_time: new Date(),
        consecutive_corrects: 0,
        consecutive_wrongs: 0,
        wrong_challenges_count: 0,
        has_reversed_curse: false,
        has_boss_shield: false,
        has_force_character_attack_type: false,
        has_both_hp_decrease: false,
        has_shuffle_ss: false,
        has_permuted_ss: false,
        boss_skill_activated: false,
      },
    });
  }

  const responseEnemyHp = safeHp(progress.enemy_hp, effectiveEnemyHp);

  return {
    enemy: {
      enemy_id: enemy.enemy_id,
      enemy_name: enemy.enemy_name,
      enemy_idle: enemy.enemy_avatar,
      enemy_damage: enemy.enemy_damage,
      enemy_health: responseEnemyHp,
      enemy_max_health: effectiveEnemyHp,
      enemy_avatar: enemy.avatar_enemy,
    },
    selectedCharacter: {
      character_id: selectedCharacter.character_id,
      character_name: selectedCharacter.character_name,
      character_idle: selectedCharacter.avatar_image,
      character_health: progress.player_hp,
      character_max_health: selectedCharacter.health,
      character_damage: selectedCharacter.character_damage,
      character_attacks: selectedCharacter.character_attacks,
      character_avatar: selectedCharacter.character_avatar,
      avatar_image: selectedCharacter.character_avatar,
      is_range: selectedCharacter.is_range,
      range_attacks: selectedCharacter.range_attacks,
      character_run: selectedCharacter.character_run,
    },
    status: progress.battle_status,
    progress,
    level,
  };
}

export async function handleFight(
  playerId: number,
  levelId: number,
  enemyId: number,
  isCorrect: boolean,
  elapsedSeconds: number,
  challengeId?: number,
  alreadyAnsweredCorrectly?: boolean,
  wasEverWrong?: boolean,
  isBonusRound: boolean = false,
  isCompletingBonus: boolean = false,
  bonusTotalQuestions: number = 0,
  bonusAllCorrect: boolean = false,
  overrideAttackType?: string | null,
) {
  const level = await prisma.level.findUnique({
    where: { level_id: levelId },
    include: { challenges: true },
  });

  if (!level) throw new Error("Level not found");

  const isBossLevel =
    level.level_difficulty === "hard" || level.level_difficulty === "final";

  if (isBossLevel) {
    console.log("Boss Level detected — using fightBossEnemy()");
    return await fightBossEnemy(
      playerId,
      levelId,
      enemyId,
      isCorrect,
      elapsedSeconds,
      challengeId,
      alreadyAnsweredCorrectly,
      wasEverWrong,
      isBonusRound,
      isCompletingBonus,
      bonusTotalQuestions,
      bonusAllCorrect,
      overrideAttackType,
    );
  } else {
    console.log("Normal Level detected — using fightEnemy()");
    return await fightEnemy(
      playerId,
      levelId,
      enemyId,
      isCorrect,
      elapsedSeconds,
      challengeId,
      alreadyAnsweredCorrectly,
      wasEverWrong,
      isBonusRound,
      isCompletingBonus,
      bonusTotalQuestions,
      bonusAllCorrect,
      overrideAttackType,
    );
  }
}

//for potion response
export async function getCurrentFightState(
  playerId: number,
  levelId: number,
  enemyId: number,
  potionType?: string,
) {
  const setup = await getFightSetup(playerId, levelId);
  const enemy = await prisma.enemy.findUnique({ where: { enemy_id: enemyId } });
  if (!enemy) throw new Error("Enemy not found");

  const progress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
  });
  if (!progress) throw new Error("Progress not found");

  const character = setup.selectedCharacter;
  const level = setup.level;
  const scaledEnemyMaxHealth = getBaseEnemyHp(level);

  const charHealth = safeHp(progress.player_hp, character.character_max_health);
  const enemyHealth = safeHp(progress.enemy_hp, scaledEnemyMaxHealth);

  const answeredCount = Object.keys(progress.player_answer ?? {}).length || 0;
  const totalChallenges = level.challenges?.length ?? 0;
  const isInBonusRound = enemyHealth <= 0 && answeredCount < totalChallenges;

  let enemyDamage = enemy.enemy_damage;
  if (progress.has_freeze_effect) {
    enemyDamage = 0;
    console.log("- Freeze effect active: enemy_damage set to 0 for response");
  }

  const status = progress.battle_status ?? BattleStatus.in_progress;
  const energyStatus = await EnergyService.getPlayerEnergyStatus(playerId);

  let displayDamageArray = Array.isArray(character.character_damage)
    ? (character.character_damage as number[])
    : [10, 15, 25];

  if (progress.has_strong_effect) {
    displayDamageArray = displayDamageArray.map((d) => d * 2);
    console.log(
      "- Strong effect active: damage array doubled for display:",
      displayDamageArray,
    );
  }

  const runArray = Array.isArray(character.character_run)
    ? (character.character_run as string[])
    : [];

  const combatBackground = [
    await getBackgroundForLevel(level.map.map_name, level.level_number),
  ];

  let enemyIdleAnimation = isInBonusRound ? null : enemy.enemy_avatar || null;

  if (progress.has_boss_shield && !isInBonusRound) {
    enemyIdleAnimation =
      "https://micomi-assets.me/Enemies/Greenland/Boss%20Joshy/idle2.png";
  }

  // Properly identify the exact boss special skill type if active
  let activeBossSsType: string | null = null;
  if (progress) {
    if (progress.has_boss_shield) activeBossSsType = "shield";
    else if (progress.has_reversed_curse) activeBossSsType = "reverse";
    else if (progress.has_only_blanks_ss) activeBossSsType = "only_blanks";
    else if (progress.has_dollar_sign_ss) activeBossSsType = "dollar_sign";
    else if (progress.has_reverse_words_ss) activeBossSsType = "reverse_words";
    else if (progress.has_shuffle_ss) activeBossSsType = "shuffle";
    else if (progress.has_permuted_ss) activeBossSsType = "permuted";
    else if (progress.has_force_character_attack_type)
      activeBossSsType = "force_basic_attack";
    else if (progress.has_both_hp_decrease) activeBossSsType = "mutual_damage";
  }

  let enemy_current_state: string | null = null;
  let character_current_state: string | null = null;
  let character_attack_overlay: string | null = null;
  let enemy_attack_overlay: string | null = null;

  const questionType = level.map.map_name;

  if (progress.has_freeze_effect) {
    enemy_current_state = "Frozen";
    enemy_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Shi's%20Ice.png";
    console.log("- Freeze effect persisting from progress");
  }
  if (progress.has_strong_effect) {
    character_current_state = "Strong";
    character_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Leon%20Muscle%20Flex.png";
    console.log("- Strong effect persisting from progress");
  }
  if (progress.has_ryron_reveal) {
    character_current_state = "Reveal";
    character_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Ryron's%20Flapping%20Wings.png";
    console.log("- Ryron reveal persisting from progress");
  }

  if (potionType === "Power") {
    character_current_state = "Strong";
    character_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Leon%20Muscle%20Flex.png";
  } else if (potionType === "Immunity") {
    enemy_current_state = "Frozen";
    enemy_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Shi's%20Ice.png";
  } else if (potionType === "Reveal") {
    character_current_state = "Reveal";
    character_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Ryron's%20Flapping%20Wings.png";
  } else if (potionType === "Life") {
    character_current_state = "Revitalize";
    character_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Gino's%20Lightning.png";
  }

  let finalCharacterIdle = character.character_idle || null;

  if (character.character_name === "Leon") {
    const wrongChallengesArr = (progress.wrong_challenges ?? []) as number[];
    const isLastRemaining =
      wrongChallengesArr.length === 0 && answeredCount + 1 === totalChallenges;

    const isSpecialAttackPending =
      progress.consecutive_corrects === 2 ||
      (isLastRemaining && isInBonusRound);

    if (isSpecialAttackPending) {
      finalCharacterIdle = "https://micomi-assets.me/Hero/Leon/UltIdle.png";
      console.log(
        "- Leon is holding a special attack card: Overriding character_idle in getCurrentFightState",
      );
    }
  }

  return {
    status,
    enemy: {
      enemy_id: enemy.enemy_id,
      enemy_name: enemy.enemy_name,
      enemy_idle: enemyIdleAnimation,
      enemy_run: null,
      enemy_attack_type: null,
      enemy_attack: null,
      enemy_hurt: isInBonusRound ? enemy.enemy_hurt || null : null,
      enemy_dies: null,
      enemy_damage: enemyDamage,
      enemy_health: enemyHealth,
      enemy_max_health: scaledEnemyMaxHealth,
      enemy_avatar: enemy.avatar_enemy,
      special_skill: (() => {
        const isBossLevel =
          level.level_difficulty === "hard" ||
          level.level_difficulty === "final";

        if (!isBossLevel) {
          return {
            special_skill_image: null,
            special_skill_description: null,
            streak: progress?.consecutive_wrongs ?? 0,
            ss_type: null, // Ensured identical interface mapping
          };
        }

        return getBossSpecialSkillInfo(
          enemy.enemy_name,
          activeBossSsType,
          progress?.consecutive_wrongs,
        );
      })(),
      enemy_current_state,
      enemy_attack_overlay,
    },
    character: {
      character_id: character.character_id,
      character_name: character.character_name,
      character_idle: finalCharacterIdle,
      character_run: runArray[0] || null,
      character_attack_type: null,
      character_attack: null,
      character_range_attack: null,
      character_hurt: null,
      character_dies: null,
      character_damage: displayDamageArray,
      character_health: charHealth,
      character_max_health: character.character_max_health,
      character_avatar: character.character_avatar,
      character_is_range: character.is_range,
      special_skill: getHeroSpecialSkillInfo(
        character.character_name,
        progress?.consecutive_corrects,
      ),
      character_current_state,
      character_attack_overlay,
    },
    energy: energyStatus.energy,
    timeToNextEnergyRestore: energyStatus.timeToNextRestore,
    combat_background: combatBackground,
    question_type: questionType,
    boss_skill_activated: progress?.boss_skill_activated || false,
    isEnemyFrozen: progress?.has_freeze_effect || false,
  };
}

export async function fightEnemy(
  playerId: number,
  levelId: number,
  enemyId: number,
  isCorrect: boolean,
  elapsedSeconds: number,
  challengeId?: number,
  alreadyAnsweredCorrectly?: boolean,
  wasEverWrong?: boolean,
  isBonusRound: boolean = false,
  isCompletingBonus: boolean = false,
  bonusTotalQuestions: number = 0,
  bonusAllCorrect: boolean = false,
  overrideAttackType?: string | null,
) {
  const enemy = await prisma.enemy.findUnique({ where: { enemy_id: enemyId } });
  if (!enemy) throw new Error("Enemy not found");

  const level = await prisma.level.findUnique({
    where: { level_id: levelId },
    include: { challenges: true },
  });
  if (!level) throw new Error("Level not found");

  let progress = await prisma.playerProgress.findUnique({
    where: {
      player_id_level_id: { player_id: playerId, level_id: level.level_id },
    },
  });
  if (!progress) throw new Error("Player progress not found");

  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
    include: {
      ownedCharacters: {
        where: { is_selected: true, is_purchased: true },
        include: { character: true },
      },
    },
  });
  if (!player) throw new Error("Player not found");

  const character = player.ownedCharacters[0]?.character;
  if (!character) throw new Error("Character not found");

  const challengeCount = level.challenges?.length ?? 1;
  const scaledEnemyMaxHealth = ENEMY_HEALTH * challengeCount;

  const answeredCount = Object.keys(progress.player_answer ?? {}).length || 0;
  const totalChallenges = level.challenges?.length ?? 0;
  let enemyHealth = safeHp(progress.enemy_hp, scaledEnemyMaxHealth);
  const isDetectedBonusRound =
    enemyHealth <= 0 && answeredCount < totalChallenges;

  console.log("DEBUG Combat Service:");
  console.log("- Enemy base health:", ENEMY_HEALTH);
  console.log("- Number of challenges:", challengeCount);
  console.log("- Calculated scaled health:", scaledEnemyMaxHealth);
  console.log("- FRESH Progress enemy_hp from DB:", progress.enemy_hp);
  console.log("- FRESH Progress player_hp from DB:", progress.player_hp);
  console.log("- Detected bonus round:", isDetectedBonusRound);

  let charHealth = safeHp(progress.player_hp, character.health);

  let status: BattleStatus = BattleStatus.in_progress;

  const damageArray = Array.isArray(character.character_damage)
    ? (character.character_damage as number[])
    : [10, 15, 25];

  const attacksArray = Array.isArray(character.character_attacks)
    ? (character.character_attacks as string[])
    : [];

  const rangeAttacksArray = Array.isArray(character.range_attacks)
    ? (character.range_attacks as string[])
    : [];

  const runArray = Array.isArray(character.character_run)
    ? (character.character_run as string[])
    : [];

  console.log("- Character damage array:", damageArray);

  let character_attack_type: string | null = null;
  let damage = 0;
  let enemy_damage = 0;
  let character_attack: string | null = null;
  let character_range_attack: string | null = null;
  let enemy_attack: string | null = null;
  let enemy_hurt: string | null = null;
  let character_hurt: string | null = null;
  let character_dies: string | null = null;
  let enemy_dies: string | null = null;
  let character_idle: string | null = null;
  let enemy_idle: string | null = null;
  let enemy_run: string | null = null;
  let character_run: string | null = null;
  let character_attack_card: string | null = null;
  let card_type: string | null = null;
  let character_attack_pose: string | null = null;
  let character_current_state: string | null = null;
  let enemy_current_state: string | null = null;

  character_run = runArray[0] || null;
  character_idle = character.avatar_image || null;

  const effectiveBonusRound = isBonusRound || isDetectedBonusRound;

  if (isCorrect) {
    progress =
      (await prisma.playerProgress.findUnique({
        where: {
          player_id_level_id: { player_id: playerId, level_id: level.level_id },
        },
      })) || progress;

    let currentChallenge = null;
    if (challengeId) {
      currentChallenge = await prisma.challenge.findUnique({
        where: { challenge_id: challengeId },
      });
    }

    const correctAnswerLength = currentChallenge
      ? (currentChallenge.correct_answer as string[]).length
      : 1;

    console.log("- Challenge ID:", challengeId);
    console.log("- Correct answer length:", correctAnswerLength);
    console.log("- Elapsed seconds:", elapsedSeconds);
    console.log("- Already answered correctly:", alreadyAnsweredCorrectly);
    console.log("- Was ever wrong:", wasEverWrong);
    console.log(
      "- Current consecutive_corrects:",
      progress.consecutive_corrects,
    );

    const isFinalBonusSpecial =
      effectiveBonusRound && isCompletingBonus && bonusAllCorrect;

    // 1. Determine the Attack Type
    if (overrideAttackType) {
      character_attack_type = overrideAttackType;
    } else if (effectiveBonusRound && isCompletingBonus) {
      character_attack_type = bonusAllCorrect
        ? "special_attack"
        : "third_attack";
    } else if (effectiveBonusRound) {
      if (
        character.character_name === "Gino" &&
        progress.consecutive_corrects === 3
      ) {
        character_attack_type = "special_attack";
      } else if (
        !alreadyAnsweredCorrectly &&
        character.character_name === "Leon" &&
        progress.consecutive_corrects === 3
      ) {
        character_attack_type = "special_attack";
      } else if (
        !alreadyAnsweredCorrectly &&
        character.character_name === "ShiShi" &&
        progress.consecutive_corrects === 3
      ) {
        character_attack_type = "special_attack";
      } else if (
        !alreadyAnsweredCorrectly &&
        character.character_name === "Ryron" &&
        progress.consecutive_corrects === 3
      ) {
        character_attack_type = "special_attack";
      } else if (correctAnswerLength >= 8) {
        character_attack_type = "third_attack";
      } else if (correctAnswerLength >= 5) {
        character_attack_type = "second_attack";
      } else {
        character_attack_type = "basic_attack";
      }
    } else if (enemyHealth > 0 || answeredCount >= totalChallenges) {
      if (
        !alreadyAnsweredCorrectly &&
        character.character_name === "Gino" &&
        progress.consecutive_corrects === 3
      ) {
        character_attack_type = "special_attack";
      } else if (
        !alreadyAnsweredCorrectly &&
        character.character_name === "Leon" &&
        progress.consecutive_corrects === 3
      ) {
        character_attack_type = "special_attack";
      } else if (
        !alreadyAnsweredCorrectly &&
        character.character_name === "ShiShi" &&
        progress.consecutive_corrects === 3
      ) {
        character_attack_type = "special_attack";
      } else if (
        !alreadyAnsweredCorrectly &&
        character.character_name === "Ryron" &&
        progress.consecutive_corrects === 3
      ) {
        character_attack_type = "special_attack";
      } else if (
        !alreadyAnsweredCorrectly &&
        !wasEverWrong &&
        correctAnswerLength >= 8
      ) {
        character_attack_type = "third_attack";
      } else if (
        !alreadyAnsweredCorrectly &&
        !wasEverWrong &&
        correctAnswerLength >= 5
      ) {
        character_attack_type = "second_attack";
      } else {
        character_attack_type = "basic_attack";
      }
    }

    // 2. Resolve Attack Mapping
    if (character_attack_type) {
      const resolved = resolveAttackFromType({
        characterName: character.character_name,
        attackType: character_attack_type,
        correctAnswerLength,
        damageArray,
        attacksArray,
        rangeAttacksArray,
        runArray,
        isFinalBonusSpecial,
      });

      card_type = resolved.card_type;
      character_attack_card = resolved.character_attack_card;
      damage = resolved.damage;
      character_attack = resolved.character_attack;
      character_range_attack = resolved.character_range_attack;
      character_run = resolved.character_run;
      character_idle = character.avatar_image || null;

      console.log(
        `- Attack type resolved: ${character_attack_type} | Damage: ${damage}`,
      );
      enemy_hurt = enemy.enemy_hurt || null;
    } else {
      console.log("- Enemy already defeated: no attack shown.");
      character_idle = character.avatar_image || null;
      character_run = null;
    }

    // 3. Passive Abilities (Leon Strong Effect)
    if (progress.has_strong_effect) {
      const isLeonSSTurn =
        character.character_name === "Leon" &&
        progress.consecutive_corrects === 3 &&
        character_attack_type === "special_attack";

      if (isLeonSSTurn) {
        console.log(
          "- Leon's SS turn: Double damage will apply on NEXT correct answer",
        );
      } else {
        damage *= 2;
        await prisma.playerProgress.update({
          where: { progress_id: progress.progress_id },
          data: { has_strong_effect: false },
        });
        console.log("- Leon's passive applied: damage doubled to", damage);
      }
    }

    enemyHealth = Math.max(enemyHealth - damage, 0);
    enemy_hurt = enemy_hurt || enemy.enemy_hurt || null;

    if (!effectiveBonusRound || isCompletingBonus) {
      enemy_idle = enemy.enemy_avatar || null;
    } else {
      enemy_idle = null;
    }

    console.log("- Enemy health after attack:", enemyHealth);

    if (enemyHealth <= 0) {
      const wrongChallengesCount = (
        (progress.wrong_challenges as unknown[]) ?? []
      ).length;

      const isBonusRoundStunned =
        answeredCount < totalChallenges && !isCompletingBonus;

      if (isBonusRoundStunned) {
        // Non-final bonus: stunned state, show hurt (no dies)
        status = BattleStatus.in_progress;
        enemy_hurt = enemy.enemy_hurt || null;
        enemy_idle = null;
        character_idle = character.avatar_image || null;

        enemyHealth = 0;

        console.log(
          "- Enemy defeated but there are remaining challenges — entering bonus/stunned state",
        );
      } else {
        // Win condition: answered all challenges (bonus completion or normal)
        if (answeredCount >= totalChallenges || isCompletingBonus) {
          status = BattleStatus.won;
          enemy_dies = enemy.enemy_dies || null;
          enemy_hurt = enemy.enemy_hurt || null;

          enemy_idle = null;

          enemy_run = null;
          enemy_attack = null;

          character_idle = character.avatar_image || null;
          character_run = runArray[0] || null;

          if (!progress.has_received_rewards) {
            const totalExp = progress.total_exp_points_earned ?? 0;
            const totalPoints = progress.total_points_earned ?? 0;
            const totalCoins = progress.coins_earned ?? 0;

            // Always give base rewards on win
            await updateQuestProgress(playerId, QuestType.defeat_enemy, 1);

            await grantRewards(playerId, {
              exp: totalExp,
              coins: totalCoins,
              total_points: totalPoints,
            });

            await updateQuestProgress(playerId, QuestType.earn_exp, totalExp);

            // Perfect rewards only if no wrongs and no damage
            if (wrongChallengesCount === 0 && !progress.took_damage) {
              await updateQuestProgress(
                playerId,
                QuestType.defeat_enemy_full_hp,
                1,
              );
              await updateQuestProgress(playerId, QuestType.perfect_level, 1);
            }
          }

          try {
            await LevelService.unlockNextLevel(
              playerId,
              level.map_id,
              level.level_id,
            );
            console.log(
              "- Level unlocked after enemy defeated and all challenges answered",
            );
          } catch (err) {
            console.error("Error unlocking next level:", err);
          }

          console.log("- Level won with completion rewards");
        }
      }
    }
  } else {
    // WRONG ANSWER CONSUMPTION LOGIC (APPLIES TO NORMAL AND BONUS ROUNDS)
    const freezeConsumedThisTurn = progress.has_freeze_effect === true;
    if (freezeConsumedThisTurn) {
      enemy_damage = 0;
      enemy_run = null;
      enemy_attack = null;
      enemy_current_state = null;
      character_hurt = null;
      character_run = null;
      enemy_idle = enemy.enemy_avatar || null;

      await prisma.playerProgress.update({
        where: { progress_id: progress.progress_id },
        data: { has_freeze_effect: false },
      });
      progress.has_freeze_effect = false;
      console.log(
        "- Freeze effect consumed: enemy turn skipped and no damage taken.",
      );
    }

    if (progress.has_strong_effect) {
      await prisma.playerProgress.update({
        where: { progress_id: progress.progress_id },
        data: { has_strong_effect: false },
      });
      progress.has_strong_effect = false;
      console.log(
        "- Wrong answer (Normal Enemy): Leon's Strong Effect has dissipated.",
      );
    }

    if (!effectiveBonusRound && enemyHealth > 0) {
      if (!freezeConsumedThisTurn) {
        enemy_damage = enemy.enemy_damage;
        charHealth = Math.max(charHealth - enemy_damage, 0);
        enemy_idle = enemy.enemy_avatar || null;
        enemy_run = enemy.enemy_run || null;
        enemy_attack = enemy.enemy_attack || null;
        character_hurt = character.character_hurt || null;
        character_run = null;
        console.log(
          "- Enemy dealt",
          enemy_damage,
          "damage, player health:",
          charHealth,
        );

        if (charHealth < character.health) {
          await prisma.playerProgress.update({
            where: { progress_id: progress.progress_id },
            data: { took_damage: true },
          });
        }

        if (charHealth <= 0) {
          status = BattleStatus.lost;
          character_hurt = character.character_hurt || null;
          character_dies = character.character_dies || null;

          enemy_run = enemy.enemy_run || null;

          character_idle = null;
          character_run = null;
          character_attack_type = null;
        }
      }
    } else if (effectiveBonusRound) {
      console.log(
        "- Bonus round wrong: No enemy counterattack (safe mode), enemy stays hurt",
      );
      character_idle = character.avatar_image || null;
      character_run = null;
      enemy_idle = null;
      enemy_hurt = enemy.enemy_hurt || null;
      enemy_damage = 0;
    } else {
      console.log("- Enemy already defeated: no counterattack.");
    }

    // Check for win after bonus completion on wrong answer
    if (
      status === BattleStatus.in_progress &&
      effectiveBonusRound &&
      isCompletingBonus &&
      enemyHealth <= 0
    ) {
      const wrongChallengesCount = (
        (progress.wrong_challenges as unknown[]) ?? []
      ).length;
      const effectiveAnsweredCount = answeredCount + 1;

      if (effectiveAnsweredCount >= totalChallenges) {
        status = BattleStatus.won;
        enemy_dies = enemy.enemy_dies || null;
        enemy_hurt = enemy.enemy_hurt || null;

        enemy_idle = null;
        enemy_run = null;
        enemy_attack = null;

        character_idle = character.avatar_image || null;
        character_run = runArray[0] || null;

        if (!progress.has_received_rewards) {
          const totalExp = progress.total_exp_points_earned ?? 0;
          const totalPoints = progress.total_points_earned ?? 0;
          const totalCoins = progress.coins_earned ?? 0;

          // Always give base rewards on win
          await updateQuestProgress(playerId, QuestType.defeat_enemy, 1);

          await grantRewards(playerId, {
            exp: totalExp,
            coins: totalCoins,
            total_points: totalPoints,
          });

          await updateQuestProgress(playerId, QuestType.earn_exp, totalExp);

          // Perfect rewards only if no wrongs and no damage
          if (wrongChallengesCount === 0 && !progress.took_damage) {
            await updateQuestProgress(
              playerId,
              QuestType.defeat_enemy_full_hp,
              1,
            );
            await updateQuestProgress(playerId, QuestType.perfect_level, 1);
          }
        }

        try {
          await LevelService.unlockNextLevel(
            playerId,
            level.map_id,
            level.level_id,
          );
          console.log(
            "- Level unlocked after enemy defeated and all challenges answered",
          );
        } catch (err) {
          console.error("Error unlocking next level:", err);
        }

        console.log("- Level won with completion rewards");
      }
    }
  }

  if (
    status === BattleStatus.in_progress &&
    enemyHealth <= 0 &&
    answeredCount >= totalChallenges
  ) {
    console.log(
      "- Bonus round completed (all challenges answered), setting status to won",
    );
    status = BattleStatus.won;
    enemy_dies = enemy.enemy_dies || null;
    enemy_hurt = enemy.enemy_hurt || null;
    enemy_idle = null;
    enemy_run = null;
    enemy_attack = null;

    character_idle = character.avatar_image || null;
    character_run = runArray[0] || null;

    if (!progress.has_received_rewards) {
      const wrongChallengesCount = (
        (progress.wrong_challenges as unknown[]) ?? []
      ).length;
      const totalExp = progress.total_exp_points_earned ?? 0;
      const totalPoints = progress.total_points_earned ?? 0;
      const totalCoins = progress.coins_earned ?? 0;

      await updateQuestProgress(playerId, QuestType.defeat_enemy, 1);

      await grantRewards(playerId, {
        exp: totalExp,
        coins: totalCoins,
        total_points: totalPoints,
      });

      await updateQuestProgress(playerId, QuestType.earn_exp, totalExp);

      if (wrongChallengesCount === 0) {
        await updateQuestProgress(playerId, QuestType.perfect_level, 1);
      }

      if (!progress.took_damage) {
        await updateQuestProgress(playerId, QuestType.defeat_enemy_full_hp, 1);
      }
    }

    try {
      await LevelService.unlockNextLevel(
        playerId,
        level.map_id,
        level.level_id,
      );
      console.log(
        "- Level unlocked after all challenges answered (bonus completed)",
      );
    } catch (err) {
      console.error("Error unlocking next level:", err);
    }
  }

  await prisma.playerProgress.update({
    where: {
      player_id_level_id: { player_id: playerId, level_id: level.level_id },
    },
    data: {
      player_hp: charHealth,
      enemy_hp: enemyHealth,
      battle_status: status,
      ...(status === BattleStatus.won
        ? { is_completed: true, completed_at: new Date() }
        : {}),
    },
  });

  const updatedEnergyStatus =
    await EnergyService.getPlayerEnergyStatus(playerId);

  progress = await prisma.playerProgress.findUnique({
    where: {
      player_id_level_id: { player_id: playerId, level_id: level.level_id },
    },
  });

  let character_attack_overlay: string | null = null;
  let enemy_attack_overlay: string | null = null;

  if (isCorrect && progress?.consecutive_corrects === 3) {
    if (character.character_name === "Leon") {
      character_attack_overlay =
        "https://micomi-assets.me/Icons/Miscellaneous/Leon%20Muscle%20Flex.png";
    } else if (character.character_name === "ShiShi") {
      enemy_attack_overlay =
        "https://micomi-assets.me/Icons/Miscellaneous/Shi's%20Ice.png";
    } else if (character.character_name === "Ryron") {
      character_attack_overlay =
        "https://micomi-assets.me/Icons/Miscellaneous/Ryron's%20Flapping%20Wings.png";
    } else if (character.character_name === "Gino") {
      character_attack_overlay =
        "https://micomi-assets.me/Icons/Miscellaneous/Gino's%20Lightning.png";
      character_current_state = "Revitalize";
    }
  }

  //Passive effects overlay logic
  if (progress?.has_freeze_effect) {
    enemy_current_state = "Frozen";
    enemy_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Shi's%20Ice.png";
  }
  if (progress?.has_strong_effect) {
    character_current_state = "Strong";
    character_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Leon%20Muscle%20Flex.png";
  }
  if (progress?.has_ryron_reveal) {
    character_current_state = "Reveal";
    character_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Ryron's%20Flapping%20Wings.png";
  }

  console.log("Final result:");
  console.log("- Enemy health:", enemyHealth);
  console.log("- Enemy max health:", scaledEnemyMaxHealth);
  console.log("- Player health:", charHealth);

  return {
    status,
    enemy: {
      enemy_id: enemy.enemy_id,
      enemy_name: enemy.enemy_name,
      enemy_idle,
      enemy_run,
      enemy_attack_type: null,
      enemy_attack,
      enemy_hurt,
      enemy_dies,
      enemy_damage,
      enemy_health: enemyHealth,
      enemy_max_health: scaledEnemyMaxHealth,
      enemy_avatar: enemy.avatar_enemy,
      special_skill: {
        special_skill_image: null,
        special_skill_description: null,
        streak: progress?.consecutive_wrongs ?? 0,
        ss_type: null,
      },
      enemy_current_state,
      enemy_attack_overlay,
    },
    character: {
      character_id: character.character_id,
      character_name: character.character_name,
      character_idle,
      character_run,
      character_attack_type,
      character_attack,
      character_range_attack,
      character_hurt,
      character_dies,
      character_damage: damage,
      character_health: charHealth,
      character_max_health: character.health,
      character_avatar: character.character_avatar,
      character_is_range: character.is_range,
      special_skill: getHeroSpecialSkillInfo(
        character.character_name,
        progress?.consecutive_corrects,
      ),
      character_current_state,
      character_attack_overlay,
    },
    energy: updatedEnergyStatus.energy,
    timeToNextEnergyRestore: updatedEnergyStatus.timeToNextRestore,
    boss_skill_activated: progress?.boss_skill_activated || false,
  };
}

export async function fightBossEnemy(
  playerId: number,
  levelId: number,
  enemyId: number,
  isCorrect: boolean,
  elapsedSeconds: number,
  challengeId?: number,
  alreadyAnsweredCorrectly?: boolean,
  wasEverWrong?: boolean,
  isBonusRound: boolean = false,
  isCompletingBonus: boolean = false,
  bonusTotalQuestions: number = 0,
  bonusAllCorrect: boolean = false,
  overrideAttackType?: string | null,
) {
  const enemy = await prisma.enemy.findUnique({ where: { enemy_id: enemyId } });
  if (!enemy) throw new Error("Enemy not found");

  const level = await prisma.level.findUnique({
    where: { level_id: levelId },
    include: { challenges: true },
  });
  if (!level) throw new Error("Level not found");

  let progress = await prisma.playerProgress.findUnique({
    where: {
      player_id_level_id: { player_id: playerId, level_id: level.level_id },
    },
  });
  if (!progress) throw new Error("Player progress not found");

  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
    include: {
      ownedCharacters: {
        where: { is_selected: true, is_purchased: true },
        include: { character: true },
      },
    },
  });
  if (!player) throw new Error("Player not found");

  const character = player.ownedCharacters[0]?.character;
  if (!character) throw new Error("Character not found");

  const challengeCount = level.challenges?.length ?? 1;
  const scaledEnemyMaxHealth = BOSS_ENEMY_HEALTH * challengeCount;

  const answeredCount = Object.keys(progress.player_answer ?? {}).length || 0;
  const totalChallenges = level.challenges?.length ?? 0;
  let enemyHealth = safeHp(progress.enemy_hp, scaledEnemyMaxHealth);
  const isDetectedBonusRound =
    enemyHealth <= 0 && answeredCount < totalChallenges;

  let charHealth = safeHp(progress.player_hp, character.health);

  let status: BattleStatus = BattleStatus.in_progress;

  const damageArray = Array.isArray(character.character_damage)
    ? (character.character_damage as number[])
    : [10, 15, 25];

  const attacksArray = Array.isArray(character.character_attacks)
    ? (character.character_attacks as string[])
    : [];

  const rangeAttacksArray = Array.isArray(character.range_attacks)
    ? (character.range_attacks as string[])
    : [];

  const runArray = Array.isArray(character.character_run)
    ? (character.character_run as string[])
    : [];

  let character_attack_type: string | null = null;
  let damage = 0;
  let enemy_damage = 0;
  let character_attack: string | null = null;
  let character_range_attack: string | null = null;
  let enemy_attack: string | null = null;
  let enemy_hurt: string | null = null;
  let character_hurt: string | null = null;
  let character_dies: string | null = null;
  let enemy_dies: string | null = null;
  let character_idle: string | null = null;
  let enemy_idle: string | null = null;
  let enemy_run: string | null = null;
  let character_run: string | null = runArray[0] || null;
  let enemy_attack_type: string | null = null;
  let character_attack_card: string | null = null;
  let card_type: string | null = null;
  let enemy_ss_type: string | null = null;
  let enemy_current_state: string | null = null;
  let character_current_state: string | null = null;

  character_idle = character.avatar_image || null;

  const effectiveBonusRound = isBonusRound || isDetectedBonusRound;

  if (isCorrect) {
    progress =
      (await prisma.playerProgress.findUnique({
        where: {
          player_id_level_id: { player_id: playerId, level_id: level.level_id },
        },
      })) || progress;

    let currentChallenge = null;
    if (challengeId) {
      currentChallenge = await prisma.challenge.findUnique({
        where: { challenge_id: challengeId },
      });
    }

    const correctAnswerLength = currentChallenge
      ? (currentChallenge.correct_answer as string[]).length
      : 1;

    const isFinalBonusSpecial =
      effectiveBonusRound && isCompletingBonus && bonusAllCorrect;

    // 1. Determine the Attack Type
    if (overrideAttackType) {
      character_attack_type = overrideAttackType;
    } else if (effectiveBonusRound && isCompletingBonus) {
      character_attack_type = bonusAllCorrect
        ? "special_attack"
        : "third_attack";
    } else if (effectiveBonusRound) {
      if (
        character.character_name === "Gino" &&
        progress.consecutive_corrects === 3
      ) {
        character_attack_type = "special_attack";
      } else if (
        !alreadyAnsweredCorrectly &&
        progress.consecutive_corrects === 3 &&
        ["Leon", "ShiShi", "Ryron"].includes(character.character_name)
      ) {
        character_attack_type = "special_attack";
      } else if (correctAnswerLength >= 8) {
        character_attack_type = "third_attack";
      } else if (correctAnswerLength >= 5) {
        character_attack_type = "second_attack";
      } else {
        character_attack_type = "basic_attack";
      }
    } else if (enemyHealth > 0 || answeredCount >= totalChallenges) {
      if (
        !alreadyAnsweredCorrectly &&
        progress.consecutive_corrects === 3 &&
        ["Gino", "Leon", "ShiShi", "Ryron"].includes(character.character_name)
      ) {
        character_attack_type = "special_attack";
      } else if (
        !alreadyAnsweredCorrectly &&
        !wasEverWrong &&
        correctAnswerLength >= 8
      ) {
        character_attack_type = "third_attack";
      } else if (
        !alreadyAnsweredCorrectly &&
        !wasEverWrong &&
        correctAnswerLength >= 5
      ) {
        character_attack_type = "second_attack";
      } else {
        character_attack_type = "basic_attack";
      }
    }

    // 2. Resolve Attack Mapping (Ensures Card matches Animation matches Damage)
    if (character_attack_type) {
      const resolved = resolveAttackFromType({
        characterName: character.character_name,
        attackType: character_attack_type,
        correctAnswerLength,
        damageArray,
        attacksArray,
        rangeAttacksArray,
        runArray,
        isFinalBonusSpecial,
      });

      card_type = resolved.card_type;
      character_attack_card = resolved.character_attack_card;
      damage = resolved.damage;
      character_attack = resolved.character_attack;
      character_range_attack = resolved.character_range_attack;
      character_run = resolved.character_run;
      character_idle = character.avatar_image || null;

      // Boss Specific Modifier: Leon SS does double damage against bosses
      if (
        character.character_name === "Leon" &&
        character_attack_type === "special_attack"
      ) {
        damage *= 2;
      }

      enemy_hurt = enemy.enemy_hurt || null;
    } else {
      character_idle = character.avatar_image || null;
      character_run = null;
    }

    // 3. Passive Abilities (Leon Strong Effect)
    if (progress.has_strong_effect) {
      const isLeonSSTurn =
        character.character_name === "Leon" &&
        progress.consecutive_corrects === 3 &&
        character_attack_type === "special_attack";

      if (!isLeonSSTurn) {
        damage *= 2;
        await prisma.playerProgress.update({
          where: { progress_id: progress.progress_id },
          data: { has_strong_effect: false },
        });
      }
    }

    // Apply Boss Shield or Mutual Damage logic
    if (progress.has_boss_shield) {
      enemy_ss_type = "shield";
      enemy_idle = enemy.enemy_hurt || null;
      enemy_run = null;
      enemy_hurt =
        "https://micomi-assets.me/Enemies/Greenland/Boss%20Joshy/idle2.png";
      enemyHealth = Math.max(enemyHealth, 0); // Shield blocks damage

      await prisma.playerProgress.update({
        where: { progress_id: progress.progress_id },
        data: { has_boss_shield: false },
      });
    } else if (progress.has_both_hp_decrease) {
      enemy_ss_type = "mutual_damage";
      charHealth = Math.max(charHealth - damage, 0);
      enemyHealth = Math.max(enemyHealth - damage, 0);
      enemy_hurt = enemy_hurt || enemy.enemy_hurt || null;

      await prisma.playerProgress.update({
        where: { progress_id: progress.progress_id },
        data: { has_both_hp_decrease: false },
      });
    } else {
      enemyHealth = Math.max(enemyHealth - damage, 0);
      enemy_hurt = enemy_hurt || enemy.enemy_hurt || null;
    }

    if (!effectiveBonusRound || isCompletingBonus) {
      enemy_idle = enemy.enemy_avatar || null;
    } else {
      enemy_idle = null;
    }

    if (enemyHealth <= 0) {
      const wrongChallengesCount = (
        (progress.wrong_challenges as unknown[]) ?? []
      ).length;
      const isBonusRoundStunned =
        answeredCount < totalChallenges && !isCompletingBonus;

      if (isBonusRoundStunned) {
        status = BattleStatus.in_progress;
        enemy_hurt = enemy.enemy_hurt || null;
        enemy_idle = null;
        character_idle = character.avatar_image || null;
        enemyHealth = 0;
      } else {
        if (answeredCount >= totalChallenges || isCompletingBonus) {
          status = BattleStatus.won;
          enemy_idle = null;
          enemy_run = null;
          enemy_attack = null;
          enemy_hurt = enemy.enemy_hurt || null;
          enemy_dies = enemy.enemy_dies || null;
          character_idle = character.avatar_image || null;
          character_run = runArray[0] || null;

          if (!progress.has_received_rewards) {
            const totalExp = progress.total_exp_points_earned ?? 0;
            const totalPoints = progress.total_points_earned ?? 0;
            const totalCoins = progress.coins_earned ?? 0;

            await updateQuestProgress(playerId, QuestType.defeat_enemy, 1);
            if (
              enemy.enemy_difficulty === "hard" ||
              enemy.enemy_difficulty === "final"
            ) {
              await updateQuestProgress(playerId, QuestType.defeat_boss, 1);
            }

            await grantRewards(playerId, {
              exp: totalExp,
              coins: totalCoins,
              total_points: totalPoints,
            });
            await updateQuestProgress(playerId, QuestType.earn_exp, totalExp);

            if (wrongChallengesCount === 0 && !progress.took_damage) {
              await updateQuestProgress(
                playerId,
                QuestType.defeat_enemy_full_hp,
                1,
              );
              await updateQuestProgress(playerId, QuestType.perfect_level, 1);
            }
          }

          try {
            await LevelService.unlockNextLevel(
              playerId,
              level.map_id,
              level.level_id,
            );
          } catch (err) {
            console.error("Error unlocking next level:", err);
          }
        }
      }
    }
  } else {
    // WRONG ANSWER CONSUMPTION LOGIC (APPLIES TO NORMAL AND BONUS ROUNDS)
    const effectiveBonusRound = isBonusRound || isDetectedBonusRound;
    const freezeConsumedThisTurn = progress.has_freeze_effect === true;

    if (freezeConsumedThisTurn) {
      enemy_damage = 0;
      enemy_run = null;
      enemy_attack = null;
      enemy_attack_type = null;
      enemy_current_state = null;
      character_hurt = null;
      character_run = null;
      enemy_idle = enemy.enemy_avatar || null;

      await prisma.playerProgress.update({
        where: { progress_id: progress.progress_id },
        data: { has_freeze_effect: false },
      });
      progress.has_freeze_effect = false;
    }

    if (progress.has_strong_effect) {
      await prisma.playerProgress.update({
        where: { progress_id: progress.progress_id },
        data: { has_strong_effect: false },
      });
      progress.has_strong_effect = false;
    }

    if (effectiveBonusRound) {
      character_idle = character.avatar_image || null;
      character_run = null;
      enemy_idle = null;
      enemy_hurt = enemy.enemy_hurt || null;
    } else if (enemyHealth > 0) {
      if (!freezeConsumedThisTurn) {
        enemy_damage = enemy.enemy_damage;
        charHealth = Math.max(charHealth - enemy_damage, 0);
        enemy_idle = enemy.enemy_avatar || null;
        enemy_run = enemy.enemy_run || null;
        character_run = null;

        if (progress.has_reversed_curse) {
          enemy_ss_type = "reverse";
          enemy_run = enemy.enemy_run || null;
          enemy_idle = enemy.enemy_avatar || null;
          enemy_attack_type = "special attack";
          enemy_attack = enemy.special_skill || null;
        } else if (progress.has_only_blanks_ss) {
          enemy_ss_type = "only_blanks";
          enemy_attack_type = "special attack";
          enemy_attack = enemy.special_skill || null;
        } else if (progress.has_dollar_sign_ss) {
          enemy_ss_type = "dollar_sign";
          enemy_attack_type = "special attack";
          enemy_attack = enemy.special_skill || null;
        } else if (progress.has_reverse_words_ss) {
          enemy_ss_type = "reverse_words";
          enemy_attack_type = "special attack";
          enemy_attack = enemy.special_skill || null;
        } else if (progress.has_shuffle_ss) {
          enemy_ss_type = "shuffle";
          enemy_run = enemy.enemy_run || null;
          enemy_idle = enemy.enemy_avatar || null;
          enemy_attack_type = "special attack";
          enemy_attack = enemy.special_skill || null;
        } else if (progress.has_permuted_ss) {
          enemy_ss_type = "permuted";
          enemy_run = enemy.enemy_run || null;
          enemy_idle = enemy.enemy_avatar || null;
          enemy_attack_type = "special attack";
          enemy_attack = enemy.special_skill || null;
        } else if (progress.has_boss_shield) {
          enemy_ss_type = "shield";
          enemy_run =
            "https://micomi-assets.me/Enemies/Greenland/Boss%20Joshy/Run2.png";
          enemy_idle =
            "https://micomi-assets.me/Enemies/Greenland/Boss%20Joshy/idle2.png";
          enemy_attack_type = "special attack";
          enemy_attack = enemy.special_skill || null;
        } else if (progress.has_force_character_attack_type) {
          enemy_ss_type = "force_basic_attack";
          enemy_run = enemy.enemy_run || null;
          enemy_idle = enemy.enemy_avatar || null;
          enemy_attack_type = "special attack";
          enemy_attack = enemy.special_skill || null;
        } else if (progress.has_both_hp_decrease) {
          enemy_ss_type = "mutual_damage";
          enemy_run = enemy.enemy_run || null;
          enemy_idle = enemy.enemy_avatar || null;
          enemy_attack_type = "special attack";
          enemy_attack = enemy.special_skill || null;
        } else {
          enemy_attack_type = "basic attack";
          enemy_attack = enemy.enemy_attack || null;
        }

        character_hurt = character.character_hurt || null;

        if (charHealth < character.health) {
          await prisma.playerProgress.update({
            where: { progress_id: progress.progress_id },
            data: { took_damage: true },
          });
          progress.took_damage = true;
        }

        if (charHealth <= 0) {
          status = BattleStatus.lost;
          character_hurt = character.character_hurt || null;
          character_dies = character.character_dies || null;
          enemy_run = enemy.enemy_run || null;
          character_idle = null;
          character_run = null;
          character_attack_type = null;
        }
      }
    }

    if (
      status === BattleStatus.in_progress &&
      effectiveBonusRound &&
      isCompletingBonus &&
      enemyHealth <= 0
    ) {
      const wrongChallengesCount = (
        (progress.wrong_challenges as unknown[]) ?? []
      ).length;
      const effectiveAnsweredCount = answeredCount + 1;

      if (effectiveAnsweredCount >= totalChallenges) {
        status = BattleStatus.won;
        enemy_idle = null;
        enemy_run = null;
        enemy_attack = null;
        enemy_hurt = enemy.enemy_hurt || null;
        enemy_dies = enemy.enemy_dies || null;
        character_idle = character.avatar_image || null;
        character_run = runArray[0] || null;

        if (!progress.has_received_rewards) {
          const totalExp = progress.total_exp_points_earned ?? 0;
          const totalPoints = progress.total_points_earned ?? 0;
          const totalCoins = progress.coins_earned ?? 0;

          await updateQuestProgress(playerId, QuestType.defeat_enemy, 1);
          if (
            enemy.enemy_difficulty === "hard" ||
            enemy.enemy_difficulty === "final"
          ) {
            await updateQuestProgress(playerId, QuestType.defeat_boss, 1);
          }

          await grantRewards(playerId, {
            exp: totalExp,
            coins: totalCoins,
            total_points: totalPoints,
          });
          await updateQuestProgress(playerId, QuestType.earn_exp, totalExp);

          if (wrongChallengesCount === 0 && !progress.took_damage) {
            await updateQuestProgress(
              playerId,
              QuestType.defeat_enemy_full_hp,
              1,
            );
            await updateQuestProgress(playerId, QuestType.perfect_level, 1);
          }
        }

        try {
          await LevelService.unlockNextLevel(
            playerId,
            level.map_id,
            level.level_id,
          );
        } catch (err) {
          console.error("Error unlocking next level:", err);
        }
      }
    }
  }

  if (
    status === BattleStatus.in_progress &&
    enemyHealth <= 0 &&
    answeredCount >= totalChallenges
  ) {
    status = BattleStatus.won;
    enemy_idle = null;
    enemy_run = null;
    enemy_attack = null;
    enemy_hurt = enemy.enemy_hurt || null;
    enemy_dies = enemy.enemy_dies || null;
    character_idle = character.avatar_image || null;
    character_run = runArray[0] || null;

    if (!progress.has_received_rewards) {
      const wrongChallengesCount = (
        (progress.wrong_challenges as unknown[]) ?? []
      ).length;
      const totalExp = progress.total_exp_points_earned ?? 0;
      const totalPoints = progress.total_points_earned ?? 0;
      const totalCoins = progress.coins_earned ?? 0;

      await updateQuestProgress(playerId, QuestType.defeat_enemy, 1);
      if (
        enemy.enemy_difficulty === "hard" ||
        enemy.enemy_difficulty === "final"
      ) {
        await updateQuestProgress(playerId, QuestType.defeat_boss, 1);
      }

      await grantRewards(playerId, {
        exp: totalExp,
        coins: totalCoins,
        total_points: totalPoints,
      });
      await updateQuestProgress(playerId, QuestType.earn_exp, totalExp);

      if (wrongChallengesCount === 0) {
        await updateQuestProgress(playerId, QuestType.perfect_level, 1);
      }

      if (!progress.took_damage) {
        await updateQuestProgress(playerId, QuestType.defeat_enemy_full_hp, 1);
      }
    }

    try {
      await LevelService.unlockNextLevel(
        playerId,
        level.map_id,
        level.level_id,
      );
    } catch (err) {
      console.error("Error unlocking next level:", err);
    }
  }

  await prisma.playerProgress.update({
    where: {
      player_id_level_id: { player_id: playerId, level_id: level.level_id },
    },
    data: {
      player_hp: charHealth,
      enemy_hp: enemyHealth,
      battle_status: status,
      ...(status === BattleStatus.won
        ? { is_completed: true, completed_at: new Date() }
        : {}),
    },
  });

  let character_attack_overlay: string | null = null;
  let enemy_attack_overlay: string | null = null;

  if (isCorrect && progress.consecutive_corrects === 3) {
    if (character.character_name === "Leon") {
      character_attack_overlay =
        "https://micomi-assets.me/Icons/Miscellaneous/Leon%20Muscle%20Flex.png";
    } else if (character.character_name === "ShiShi") {
      enemy_attack_overlay =
        "https://micomi-assets.me/Icons/Miscellaneous/Shi's%20Ice.png";
    } else if (character.character_name === "Ryron") {
      character_attack_overlay =
        "https://micomi-assets.me/Icons/Miscellaneous/Ryron's%20Flapping%20Wings.png";
    } else if (character.character_name === "Gino") {
      character_attack_overlay =
        "https://micomi-assets.me/Icons/Miscellaneous/Gino's%20Lightning.png";
      character_current_state = "Revitalize";
    }
  }

  const updatedEnergyStatus =
    await EnergyService.getPlayerEnergyStatus(playerId);
  progress = await prisma.playerProgress.findUnique({
    where: {
      player_id_level_id: { player_id: playerId, level_id: level.level_id },
    },
  });

  if (progress?.has_freeze_effect) {
    enemy_current_state = "Frozen";
    enemy_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Shi's%20Ice.png";
  }
  if (progress?.has_strong_effect) {
    character_current_state = "Strong";
    character_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Leon%20Muscle%20Flex.png";
  }
  if (progress?.has_ryron_reveal) {
    character_current_state = "Reveal";
    character_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Ryron's%20Flapping%20Wings.png";
  }

  return {
    status,
    enemy: {
      enemy_id: enemy.enemy_id,
      enemy_name: enemy.enemy_name,
      enemy_idle,
      enemy_run,
      enemy_attack_type,
      enemy_attack,
      enemy_hurt,
      enemy_dies,
      enemy_damage,
      enemy_health: enemyHealth,
      enemy_max_health: scaledEnemyMaxHealth,
      enemy_avatar: enemy.avatar_enemy,
      special_skill: getBossSpecialSkillInfo(
        enemy.enemy_name,
        enemy_ss_type,
        progress?.consecutive_wrongs,
      ),
      enemy_current_state,
      enemy_attack_overlay,
    },
    character: {
      character_id: character.character_id,
      character_name: character.character_name,
      character_idle,
      character_run,
      character_attack_type,
      character_attack,
      character_range_attack,
      character_hurt,
      character_dies,
      character_damage: damage,
      character_health: charHealth,
      character_max_health: character.health,
      character_avatar: character.character_avatar,
      character_is_range: character.is_range,
      special_skill: getHeroSpecialSkillInfo(
        character.character_name,
        progress?.consecutive_corrects,
      ),
      character_current_state,
      character_attack_overlay,
    },
    energy: updatedEnergyStatus.energy,
    timeToNextEnergyRestore: updatedEnergyStatus.timeToNextRestore,
    boss_skill_activated: progress?.boss_skill_activated || false,
  };
}
