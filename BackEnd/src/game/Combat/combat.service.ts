import {
  PrismaClient,
  BattleStatus,
  DifficultyLevel,
  QuestType,
} from "@prisma/client";
import * as EnergyService from "../Energy/energy.service";
import * as LevelService from "../Levels/levels.service";
import { updateQuestProgress } from "../Quests/quests.service";
import { updateProgressForChallenge } from "./special_attack.helper";
import { formatTimer } from "../../../helper/dateTimeHelper";

const prisma = new PrismaClient();

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
    include: { challenges: true, enemy: true },
  });
  if (!level) throw new Error("Level not found");
  if (!level.enemy) throw new Error("No enemy assigned to this level");

  const enemy = level.enemy;

  let progress = await prisma.playerProgress.findUnique({
    where: {
      player_id_level_id: { player_id: playerId, level_id: level.level_id },
    },
  });

  const scaledEnemyHp = enemy.enemy_health * (level.challenges?.length ?? 1);

  if (!progress) {
    progress = await prisma.playerProgress.create({
      data: {
        player_id: playerId,
        level_id: level.level_id,
        current_level: level.level_id,
        attempts: 0,
        player_answer: [],
        wrong_challenges: [],
        enemy_hp: scaledEnemyHp,
        player_hp: selectedCharacter.health,
        battle_status: BattleStatus.in_progress,
        challenge_start_time: new Date(),
      },
    });
  }

  const responseEnemyHp = safeHp(progress.enemy_hp, scaledEnemyHp);

  return {
    enemy: {
      enemy_id: enemy.enemy_id,
      enemy_name: enemy.enemy_name,
      enemy_idle: enemy.enemy_avatar,
      enemy_damage: enemy.enemy_damage,
      enemy_health: responseEnemyHp,
      enemy_max_health: scaledEnemyHp,
    },
    selectedCharacter: {
      character_id: selectedCharacter.character_id,
      character_name: selectedCharacter.character_name,
      character_idle: selectedCharacter.avatar_image,
      character_health: progress.player_hp,
      character_max_health: selectedCharacter.health,
      character_damage: selectedCharacter.character_damage,
      character_attacks: selectedCharacter.character_attacks,
    },
    status: progress.battle_status,
    progress,
    level,
  };
}

export async function fightEnemy(
  playerId: number,
  enemyId: number,
  isCorrect: boolean,
  elapsedSeconds: number,
  challengeId?: number,
  alreadyAnsweredCorrectly?: boolean,
  wasEverWrong?: boolean
) {
  const enemy = await prisma.enemy.findUnique({ where: { enemy_id: enemyId } });
  if (!enemy) throw new Error("Enemy not found");

  const level = await prisma.level.findFirst({
    where: {
      map: { map_name: enemy.enemy_map },
      level_difficulty: enemy.enemy_difficulty as DifficultyLevel,
    },
    include: { challenges: true },
  });
  if (!level) throw new Error("Level not found for enemy's map + difficulty");

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
  const scaledEnemyMaxHealth = enemy.enemy_health * challengeCount;

  console.log("DEBUG Combat Service:");
  console.log("- Enemy base health:", enemy.enemy_health);
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

  let characterAttackType: string | null = null;
  let damage = 0;
  let enemyDamage = 0;
  let attackUrl: string | null = null;
  let enemyAttackUrl: string | null = null;
  let enemyHurtUrl: string | null = null;
  let characterHurtUrl: string | null = null;
  let characterDiesUrl: string | null = null;
  let enemyDiesUrl: string | null = null;
  let character_idle: string | null = null;
  let enemy_idle: string | null = null;
  let enemy_run: string | null = null;
  let character_run: string | null = null;

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

    if (
      !alreadyAnsweredCorrectly &&
      !wasEverWrong &&
      correctAnswerLength >= 5
    ) {
      characterAttackType = "special_attack";
      damage = damageArray[2] ?? 25;
      character_run = character.character_run || null;
      attackUrl = attacksArray[2] || null;
      character_idle = character.avatar_image || null;
      console.log("- Special attack triggered!");
    } else if (correctAnswerLength > 2) {
      if (elapsedSeconds > 5) {
        characterAttackType = "basic_attack";
        damage = damageArray[0] ?? 10;
        character_run = character.character_run || null;
        attackUrl = attacksArray[0] || null;
        character_idle = character.avatar_image || null;
        console.log("- Basic attack triggered!");
      } else {
        characterAttackType = "second_attack";
        damage = damageArray[1] ?? 15;
        character_run = character.character_run || null;
        attackUrl = attacksArray[1] || null;
        character_idle = character.avatar_image || null;
        console.log("- Second attack triggered!");
      }
    } else {
      characterAttackType = "basic_attack";
      damage = damageArray[0] ?? 10;
      character_run = character.character_run || null;
      attackUrl = attacksArray[0] || null;
      character_idle = character.avatar_image || null;
      console.log("- Basic attack triggered at default!");
    }

    console.log("- Attack type:", characterAttackType);
    console.log("- Base damage:", damage);
    console.log("- Paired attack URL:", attackUrl);

    if (progress.has_strong_effect) {
      damage *= 2;
      await prisma.playerProgress.update({
        where: { progress_id: progress.progress_id },
        data: { has_strong_effect: false },
      });
      console.log("- Strong potion applied, damage doubled");
    }

    enemyHealth = Math.max(enemyHealth - damage, 0);
    enemyHurtUrl = enemy.enemy_hurt || null;
    enemy_idle = enemy.enemy_avatar || null;
    console.log("- Enemy health after attack:", enemyHealth);

    if (enemyHealth <= 0) {
      const answeredCount = Object.keys(progress.player_answer ?? {}).length;
      const totalChallenges = level.challenges.length;
      if (answeredCount === totalChallenges) {
        status = BattleStatus.won;
        enemyDiesUrl = enemy.enemy_dies || null;

        if (!progress.is_completed) {
          const totalExp = level.challenges.reduce(
            (sum, c) => sum + c.points_reward,
            0
          );
          const totalPoints = level.challenges.reduce(
            (sum, c) => sum + c.points_reward,
            0
          );
          const totalCoins = level.challenges.reduce(
            (sum, c) => sum + c.coins_reward,
            0
          );

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
  } else {
    if (enemyHealth > 0) {
      if (progress.has_freeze_effect) {
        enemyDamage = 0;
        await prisma.playerProgress.update({
          where: { progress_id: progress.progress_id },
          data: { has_freeze_effect: false },
        });
        console.log("- Freeze potion active, enemy attack nullified");
      }

      enemyDamage = enemy.enemy_damage;
      charHealth = Math.max(charHealth - enemyDamage, 0);
      enemy_idle = enemy.enemy_avatar || null;
      enemy_run = enemy.enemy_run || null;
      enemyAttackUrl = enemy.enemy_attack || null;
      characterHurtUrl = character.character_hurt || null;
      console.log(
        "- Enemy dealt",
        enemyDamage,
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
        characterDiesUrl = character.character_dies || null;

        // await EnergyService.deductEnergy(playerId, 1); disabled to allow retries while testing
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
      enemy_attack: enemyAttackUrl,
      enemy_hurt: enemyHurtUrl,
      enemy_dies: enemyDiesUrl,
      enemy_damage: enemyDamage,
      enemy_health: enemyHealth,
      enemy_max_health: scaledEnemyMaxHealth,
    },
    character: {
      character_id: character.character_id,
      character_name: character.character_name,
      character_idle,
      character_run,
      character_attack_type: characterAttackType,
      character_attack: attackUrl,
      character_hurt: characterHurtUrl,
      character_dies: characterDiesUrl,
      character_damage: damage,
      character_health: charHealth,
      character_max_health: character.health,
    },
    timer: formatTimer(Math.max(0, Math.floor(elapsedSeconds))),
    energy: updatedEnergyStatus.energy,
    timeToNextEnergyRestore: updatedEnergyStatus.timeToNextRestore,
  };
}
