import { PrismaClient, BattleStatus, QuestType } from "@prisma/client";
import * as EnergyService from "../Energy/energy.service";
import * as LevelService from "../Levels/levels.service";
import { updateQuestProgress } from "../Quests/quests.service";
import { formatTimer } from "../../../helper/dateTimeHelper";
import { getBackgroundForLevel } from "../../../helper/combatBackgroundHelper";

const prisma = new PrismaClient();

const ENEMY_HEALTH = 30;
const BOSS_ENEMY_HEALTH = 30;

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
        has_reversed_curse: false,
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
      character_avatar: selectedCharacter.avatar_image,
      avatar_image: selectedCharacter.avatar_image,
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
  bonusTotalQuestions: number = 0
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
      bonusTotalQuestions
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
      bonusTotalQuestions
    );
  }
}

//for potion response
export async function getCurrentFightState(
  playerId: number,
  levelId: number,
  enemyId: number
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
      displayDamageArray
    );
  }

  const combatBackground = [
    await getBackgroundForLevel(level.map.map_name, level.level_number),
  ];

  return {
    status,
    enemy: {
      enemy_id: enemy.enemy_id,
      enemy_name: enemy.enemy_name,
      enemy_idle: enemy.enemy_avatar || null,
      enemy_run: null,
      enemy_attack: null,
      enemy_hurt: null,
      enemy_dies: null,
      enemy_damage: enemyDamage,
      enemy_health: enemyHealth,
      enemy_max_health: scaledEnemyMaxHealth,
      enemy_avatar: enemy.avatar_enemy,
      enemy_attack_type: null,
      enemy_special_skill: null,
    },
    character: {
      character_id: character.character_id,
      character_name: character.character_name,
      character_idle: character.character_idle || null,
      character_run: null,
      character_attack_type: null,
      character_attack: null,
      character_hurt: null,
      character_dies: null,
      character_damage: displayDamageArray,
      character_health: charHealth,
      character_max_health: character.character_max_health,
      character_avatar: character.character_avatar,
    },
    timer: "00:00",
    energy: energyStatus.energy,
    timeToNextEnergyRestore: energyStatus.timeToNextRestore,
    combat_background: combatBackground,
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
  bonusTotalQuestions: number = 0
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

  console.log("DEBUG Combat Service:");
  console.log("- Enemy base health:", ENEMY_HEALTH);
  console.log("- Number of challenges:", challengeCount);
  console.log("- Calculated scaled health:", scaledEnemyMaxHealth);
  console.log("- FRESH Progress enemy_hp from DB:", progress.enemy_hp);
  console.log("- FRESH Progress player_hp from DB:", progress.player_hp);

  let charHealth = safeHp(progress.player_hp, character.health);
  let enemyHealth = safeHp(progress.enemy_hp, scaledEnemyMaxHealth);

  let status: BattleStatus = BattleStatus.in_progress;

  const damageArray = Array.isArray(character.character_damage)
    ? (character.character_damage as number[])
    : [10, 15, 25];

  const attacksArray = Array.isArray(character.character_attacks)
    ? (character.character_attacks as string[])
    : [];

  console.log("- Character damage array:", damageArray);

  let character_attack_type: string | null = null;
  let damage = 0;
  let enemy_damage = 0;
  let character_attack: string | null = null;
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

  character_run = character.character_run || null;
  character_idle = character.avatar_image || null;

  if (isCorrect) {
    await updateQuestProgress(playerId, QuestType.solve_challenge, 1);

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

    if (isBonusRound) {
      if (isCompletingBonus) {
        character_attack_type =
          bonusTotalQuestions >= 5 ? "special_attack" : "third_skill";
        if (bonusTotalQuestions >= 5) {
          character_attack_card = "no card for special finale attack";
          damage = damageArray[3] ?? 25;
          character_attack = attacksArray[3] || null;
        } else {
          character_attack_card =
            "https://res.cloudinary.com/dpbocuozx/image/upload/v1760942688/15cdfe1f-dc78-4f25-a4ae-5cbbc27a4060_jmzqz6.png";
          damage = damageArray[2] ?? 15;
          character_attack = attacksArray[2] || null;
        }
        character_run = character.character_run || null;
        character_idle = character.avatar_image || null;
        console.log(
          `- Final bonus ${character_attack_type} triggered with ${bonusTotalQuestions} questions!`
        );

        console.log("- Attack type:", character_attack_type);
        console.log("- Base damage:", damage);
        console.log("- Paired attack URL:", character_attack);

        if (progress.has_strong_effect) {
          damage *= 2;
          await prisma.playerProgress.update({
            where: { progress_id: progress.progress_id },
            data: { has_strong_effect: false },
          });
          console.log("- Strong potion applied, damage doubled");
        }

        enemyHealth = Math.max(enemyHealth - damage, 0);
        enemy_hurt = enemy.enemy_hurt || null;
        enemy_idle = enemy.enemy_avatar || null;
        console.log("- Enemy health after final bonus attack:", enemyHealth);
      } else {
        character_idle = character.avatar_image || null;
        enemy_hurt = enemy.enemy_hurt || null;
        console.log(
          "- Bonus round correct (non-final): character idle, enemy hurt"
        );
      }
    } else if (enemyHealth > 0) {
      if (
        !alreadyAnsweredCorrectly &&
        !wasEverWrong &&
        correctAnswerLength >= 8
      ) {
        character_attack_type = "third_attack";
        character_attack_card =
          "https://res.cloudinary.com/dpbocuozx/image/upload/v1760942688/15cdfe1f-dc78-4f25-a4ae-5cbbc27a4060_jmzqz6.png";
        damage = damageArray[2] ?? 25;
        character_run = character.character_run || null;
        character_attack = attacksArray[2] || null;
        character_idle = character.avatar_image || null;
        console.log("- Third attack triggered!");
      } else if (
        !alreadyAnsweredCorrectly &&
        !wasEverWrong &&
        (correctAnswerLength >= 5 || correctAnswerLength < 8)
      ) {
        character_attack_type = "second_attack";
        character_attack_card =
          "https://res.cloudinary.com/dpbocuozx/image/upload/v1760942690/b86116f4-4c3c-4f9c-bec3-7628482673e8_eh6biu.png";
        damage = damageArray[1] ?? 15;
        character_run = character.character_run || null;
        character_attack = attacksArray[1] || null;
        character_idle = character.avatar_image || null;
        console.log("- Second attack triggered!");
      } else {
        character_attack_type = "basic_attack";
        character_attack_card =
          "https://res.cloudinary.com/dpbocuozx/image/upload/v1760942690/Untitled_1024_x_1536_px__20251020_131545_0000_hs8lr4.png";
        damage = damageArray[0] ?? 10;
        character_run = character.character_run || null;
        character_attack = attacksArray[0] || null;
        character_idle = character.avatar_image || null;
        console.log("- Basic attack triggered at default!");
      }

      console.log("- Attack type:", character_attack_type);
      console.log("- Base damage:", damage);
      console.log("- Paired attack URL:", character_attack);

      if (progress.has_strong_effect) {
        damage *= 2;
        await prisma.playerProgress.update({
          where: { progress_id: progress.progress_id },
          data: { has_strong_effect: false },
        });
        console.log("- Strong potion applied, damage doubled");
      }

      enemyHealth = Math.max(enemyHealth - damage, 0);
      enemy_hurt = enemy.enemy_hurt || null;
      enemy_idle = enemy.enemy_avatar || null;
      console.log("- Enemy health after attack:", enemyHealth);
    } else {
      console.log("- Enemy already defeated: no attack shown.");
      character_idle = character.avatar_image || null;
      character_run = null;
    }

    if (enemyHealth <= 0) {
      const answeredCount = Object.keys(progress.player_answer ?? {}).length;
      const totalChallenges = level.challenges.length;
      const wrongChallengesCount = (
        (progress.wrong_challenges as unknown[]) ?? []
      ).length;

      const isBonusRoundStunned = answeredCount < totalChallenges;

      if (isBonusRoundStunned) {
        status = BattleStatus.in_progress;
        enemy_hurt = enemy.enemy_hurt || null;
        enemy_idle = null;
        character_idle = character.avatar_image || null;
        character_run = null;

        enemyHealth = 0;

        console.log(
          "- Enemy defeated but there are remaining challenges — entering bonus/stunned state"
        );
      } else {
        enemy_dies = enemy.enemy_dies || null;

        enemy_hurt = null;
        enemy_idle = null;
        enemy_run = null;
        enemy_attack = null;

        character_idle = null;
        character_run = character.character_run || null;

        if (answeredCount === totalChallenges && wrongChallengesCount === 0) {
          status = BattleStatus.won;

          if (!progress.is_completed) {
            const totalExp = progress.total_exp_points_earned ?? 0;
            const totalPoints = progress.total_points_earned ?? 0;
            const totalCoins = progress.coins_earned ?? 0;

            await updateQuestProgress(playerId, QuestType.defeat_enemy, 1);

            if (status === BattleStatus.won) {
              if (!progress.took_damage) {
                await updateQuestProgress(
                  playerId,
                  QuestType.defeat_enemy_full_hp,
                  1
                );

                await updateQuestProgress(playerId, QuestType.perfect_level, 1);
              }
            }

            if (
              enemy.enemy_difficulty === "hard" ||
              enemy.enemy_difficulty === "final"
            ) {
              await updateQuestProgress(playerId, QuestType.defeat_boss, 1);
            }

            await prisma.player.update({
              where: { player_id: playerId },
              data: {
                total_points: { increment: totalPoints },
                exp_points: { increment: totalExp },
                coins: { increment: totalCoins },
              },
            });

            await updateQuestProgress(playerId, QuestType.earn_exp, totalExp);
          }

          try {
            await LevelService.unlockNextLevel(
              playerId,
              level.map_id,
              level.level_number
            );
            console.log(
              "- Level unlocked after enemy defeated and all challenges answered"
            );
          } catch (err) {
            console.error("Error unlocking next level:", err);
          }
        }
      }
    }
  } else {
    if (isBonusRound) {
      character_idle = character.avatar_image || null;
      enemy_hurt = enemy.enemy_hurt || null;
      console.log("- Bonus round wrong: character idle, enemy hurt, no damage");
    } else if (enemyHealth > 0) {
      if (progress.has_freeze_effect) {
        enemy_damage = 0;
        await prisma.playerProgress.update({
          where: { progress_id: progress.progress_id },
          data: { has_freeze_effect: false },
        });
        console.log("- Freeze potion active, enemy attack nullified");
      }

      enemy_damage = enemy.enemy_damage;
      charHealth = Math.max(charHealth - enemy_damage, 0);
      enemy_idle = enemy.enemy_avatar || null;
      enemy_run = enemy.enemy_run || null;
      enemy_attack = enemy.enemy_attack || null;
      character_hurt = character.character_hurt || null;
      console.log(
        "- Enemy dealt",
        enemy_damage,
        "damage, player health:",
        charHealth
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

        // await EnergyService.deductEnergy(playerId, 10); disabled to allow retries while testing
      }
    } else {
      console.log("- Enemy already defeated: no counterattack damage.");
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

  const updatedEnergyStatus = await EnergyService.getPlayerEnergyStatus(
    playerId
  );

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
      enemy_attack,
      enemy_hurt,
      enemy_dies,
      enemy_damage,
      enemy_health: enemyHealth,
      enemy_max_health: scaledEnemyMaxHealth,
      enemy_avatar: enemy.enemy_avatar,
    },
    character: {
      character_id: character.character_id,
      character_name: character.character_name,
      character_idle,
      character_run,
      character_attack_type,
      character_attack_card,
      character_attack,
      character_hurt,
      character_dies,
      character_damage: damage,
      character_health: charHealth,
      character_max_health: character.health,
      character_avatar: character.character_avatar,
    },
    timer: formatTimer(Math.max(0, Math.floor(elapsedSeconds))),
    energy: updatedEnergyStatus.energy,
    timeToNextEnergyRestore: updatedEnergyStatus.timeToNextRestore,
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
  bonusTotalQuestions: number = 0
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

  console.log("DEBUG Combat Service (Boss):");
  console.log("- Enemy base health:", BOSS_ENEMY_HEALTH);
  console.log("- Number of challenges:", challengeCount);
  console.log("- Calculated scaled health:", scaledEnemyMaxHealth);
  console.log("- FRESH Progress enemy_hp from DB:", progress.enemy_hp);
  console.log("- FRESH Progress player_hp from DB:", progress.player_hp);

  let charHealth = safeHp(progress.player_hp, character.health);
  let enemyHealth = safeHp(progress.enemy_hp, scaledEnemyMaxHealth);

  let status: BattleStatus = BattleStatus.in_progress;

  const damageArray = Array.isArray(character.character_damage)
    ? (character.character_damage as number[])
    : [10, 15, 25];

  const attacksArray = Array.isArray(character.character_attacks)
    ? (character.character_attacks as string[])
    : [];

  console.log("- Character damage array:", damageArray);

  let character_attack_type: string | null = null;
  let damage = 0;
  let enemy_damage = 0;
  let character_attack: string | null = null;
  let enemy_attack: string | null = null;
  let enemy_hurt: string | null = null;
  let character_hurt: string | null = null;
  let character_dies: string | null = null;
  let enemy_dies: string | null = null;
  let character_idle: string | null = null;
  let enemy_idle: string | null = null;
  let enemy_run: string | null = null;
  let character_run: string | null = null;
  let enemy_attack_type: string | null = null;
  let enemy_special_skill: string | null = null;
  let character_attack_card: string | null = null;

  character_run = character.character_run || null;
  character_idle = character.avatar_image || null;

  if (isCorrect) {
    await updateQuestProgress(playerId, QuestType.solve_challenge, 1);

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

    if (isBonusRound) {
      if (isCompletingBonus) {
        character_attack_type =
          bonusTotalQuestions >= 5 ? "special_attack" : "second_attack";
        if (bonusTotalQuestions >= 5) {
          character_attack_card =
            "https://res.cloudinary.com/dpbocuozx/image/upload/v1760942688/15cdfe1f-dc78-4f25-a4ae-5cbbc27a4060_jmzqz6.png";
          damage = damageArray[3] ?? 25;
          character_attack = attacksArray[3] || null;
        } else {
          character_attack_card =
            "https://res.cloudinary.com/dpbocuozx/image/upload/v1760942690/b86116f4-4c3c-4f9c-bec3-7628482673e8_eh6biu.pngsecond_attack_card.png";
          damage = damageArray[2] ?? 15;
          character_attack = attacksArray[2] || null;
        }
        character_run = character.character_run || null;
        character_idle = character.avatar_image || null;
        console.log(
          `- Final bonus ${character_attack_type} triggered with ${bonusTotalQuestions} questions!`
        );

        console.log("- Attack type:", character_attack_type);
        console.log("- Base damage:", damage);
        console.log("- Paired attack URL:", character_attack);

        if (progress.has_strong_effect) {
          damage *= 2;
          await prisma.playerProgress.update({
            where: { progress_id: progress.progress_id },
            data: { has_strong_effect: false },
          });
          console.log("- Strong potion applied, damage doubled");
        }

        enemyHealth = Math.max(enemyHealth - damage, 0);
        enemy_hurt = enemy.enemy_hurt || null;
        enemy_idle = enemy.enemy_avatar || null;
        console.log("- Enemy health after final bonus attack:", enemyHealth);
      } else {
        character_idle = character.avatar_image || null;
        enemy_hurt = enemy.enemy_hurt || null;
        console.log(
          "- Bonus round correct (non-final): character idle, enemy hurt"
        );
      }
    } else if (enemyHealth > 0) {
      if (
        !alreadyAnsweredCorrectly &&
        !wasEverWrong &&
        correctAnswerLength >= 8
      ) {
        character_attack_type = "third_attack";
        character_attack_card =
          "https://res.cloudinary.com/dpbocuozx/image/upload/v1760942688/15cdfe1f-dc78-4f25-a4ae-5cbbc27a4060_jmzqz6.png";
        damage = damageArray[2] ?? 25;
        character_run = character.character_run || null;
        character_attack = attacksArray[2] || null;
        character_idle = character.avatar_image || null;
        console.log("- Third attack triggered!");
      } else if (
        !alreadyAnsweredCorrectly &&
        !wasEverWrong &&
        (correctAnswerLength >= 5 || correctAnswerLength < 8)
      ) {
        character_attack_type = "second_attack";
        character_attack_card =
          "https://res.cloudinary.com/dpbocuozx/image/upload/v1760942690/b86116f4-4c3c-4f9c-bec3-7628482673e8_eh6biu.pngsecond_attack_card.png";
        damage = damageArray[1] ?? 15;
        character_run = character.character_run || null;
        character_attack = attacksArray[1] || null;
        character_idle = character.avatar_image || null;
        console.log("- Second attack triggered!");
      } else {
        character_attack_type = "basic_attack";
        character_attack_card =
          "https://res.cloudinary.com/dpbocuozx/image/upload/v1760942690/Untitled_1024_x_1536_px__20251020_131545_0000_hs8lr4.pngbasic_attack_card.png";
        damage = damageArray[0] ?? 10;
        character_run = character.character_run || null;
        character_attack = attacksArray[0] || null;
        character_idle = character.avatar_image || null;
        console.log("- Basic attack triggered at default!");
      }

      console.log("- Attack type:", character_attack_type);
      console.log("- Base damage:", damage);
      console.log("- Paired attack URL:", character_attack);

      if (progress.has_strong_effect) {
        damage *= 2;
        await prisma.playerProgress.update({
          where: { progress_id: progress.progress_id },
          data: { has_strong_effect: false },
        });
        console.log("- Strong potion applied, damage doubled");
      }

      enemyHealth = Math.max(enemyHealth - damage, 0);
      enemy_hurt = enemy.enemy_hurt || null;
      enemy_idle = enemy.enemy_avatar || null;
      console.log("- Enemy health after attack:", enemyHealth);
    } else {
      console.log("- Enemy already defeated: no attack shown.");
      character_idle = character.avatar_image || null;
      character_run = null;
    }

    if (enemyHealth <= 0) {
      const answeredCount = Object.keys(progress.player_answer ?? {}).length;
      const totalChallenges = level.challenges.length;
      const wrongChallengesCount = (
        (progress.wrong_challenges as unknown[]) ?? []
      ).length;

      const isBonusRoundStunned = answeredCount < totalChallenges;

      if (isBonusRoundStunned) {
        status = BattleStatus.in_progress;
        enemy_hurt = enemy.enemy_hurt || null;
        enemy_idle = null;
        character_idle = character.avatar_image || null;
        character_run = null;

        enemyHealth = 0;

        console.log(
          "- Boss defeated but there are remaining challenges — entering bonus/stunned state"
        );
      } else {
        enemy_hurt = null;
        enemy_idle = null;
        enemy_run = null;
        enemy_attack = null;
        enemy_dies = enemy.enemy_dies || null;

        character_idle = null;
        character_run = character.character_run || null;

        if (answeredCount === totalChallenges && wrongChallengesCount === 0) {
          status = BattleStatus.won;

          if (!progress.is_completed) {
            const totalExp = progress.total_exp_points_earned ?? 0;
            const totalPoints = progress.total_points_earned ?? 0;
            const totalCoins = progress.coins_earned ?? 0;

            await updateQuestProgress(playerId, QuestType.defeat_enemy, 1);

            if (status === BattleStatus.won) {
              if (!progress.took_damage) {
                await updateQuestProgress(
                  playerId,
                  QuestType.defeat_enemy_full_hp,
                  1
                );

                await updateQuestProgress(playerId, QuestType.perfect_level, 1);
              }
            }

            if (
              enemy.enemy_difficulty === "hard" ||
              enemy.enemy_difficulty === "final"
            ) {
              await updateQuestProgress(playerId, QuestType.defeat_boss, 1);
            }

            await prisma.player.update({
              where: { player_id: playerId },
              data: {
                total_points: { increment: totalPoints },
                exp_points: { increment: totalExp },
                coins: { increment: totalCoins },
              },
            });

            await updateQuestProgress(playerId, QuestType.earn_exp, totalExp);
          }

          try {
            await LevelService.unlockNextLevel(
              playerId,
              level.map_id,
              level.level_number
            );
            console.log(
              "- Level unlocked after boss defeated and all challenges answered"
            );
          } catch (err) {
            console.error("Error unlocking next level:", err);
          }
        }
      }
    }
  } else {
    if (isBonusRound) {
      character_idle = character.avatar_image || null;
      enemy_hurt = enemy.enemy_hurt || null;
      console.log("- Bonus round wrong: character idle, enemy hurt, no damage");
    } else if (enemyHealth > 0) {
      if (progress.has_freeze_effect) {
        enemy_damage = 0;
        await prisma.playerProgress.update({
          where: { progress_id: progress.progress_id },
          data: { has_freeze_effect: false },
        });
        console.log("- Freeze potion active, enemy attack nullified");
      }

      enemy_damage = enemy.enemy_damage;
      charHealth = Math.max(charHealth - enemy_damage, 0);
      enemy_idle = enemy.enemy_avatar || null;
      enemy_run = enemy.enemy_run || null;
      if (progress.has_reversed_curse) {
        enemy_attack_type = "special attack";
        enemy_special_skill = enemy.special_skill || null;
        console.log("- Reversed curse active: using special skill attack");
      } else {
        enemy_attack_type = "basic attack";
        enemy_attack = enemy.enemy_attack || null;
      }
      character_hurt = character.character_hurt || null;
      console.log(
        "- Enemy dealt",
        enemy_damage,
        "damage, player health:",
        charHealth
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

        // await EnergyService.deductEnergy(playerId, 10); disabled to allow retries while testing
      }
    } else {
      console.log("- Enemy already defeated: no counterattack damage.");
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

  const updatedEnergyStatus = await EnergyService.getPlayerEnergyStatus(
    playerId
  );

  console.log("Final result (Boss):");
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
      enemy_attack_type,
      enemy_attack,
      enemy_special_skill,
      enemy_hurt,
      enemy_dies,
      enemy_damage,
      enemy_health: enemyHealth,
      enemy_max_health: scaledEnemyMaxHealth,
      enemy_avatar: enemy.enemy_avatar,
    },
    character: {
      character_id: character.character_id,
      character_name: character.character_name,
      character_idle,
      character_run,
      character_attack_type,
      character_attack,
      character_hurt,
      character_dies,
      character_damage: damage,
      character_health: charHealth,
      character_max_health: character.health,
      character_avatar: character.character_avatar,
    },
    timer: formatTimer(Math.max(0, Math.floor(elapsedSeconds))),
    energy: updatedEnergyStatus.energy,
    timeToNextEnergyRestore: updatedEnergyStatus.timeToNextRestore,
  };
}
