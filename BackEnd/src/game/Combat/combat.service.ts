import {
  PrismaClient,
  BattleStatus,
  DifficultyLevel,
  QuestType,
} from "@prisma/client";
import * as EnergyService from "../Energy/energy.service";
import { updateQuestProgress } from "../Quests/quests.service";
import { formatTimer } from "../../../helper/dateTimeHelper";

const prisma = new PrismaClient();

const safeHp = (hp: number | null | undefined, fallbackMax: number) =>
  typeof hp === "number" && !Number.isNaN(hp)
    ? Math.max(hp, 0)
    : Math.max(fallbackMax, 0);

export async function getFightSetup(playerId: number, enemyId: number) {
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

  const enemy = await prisma.enemy.findUnique({ where: { enemy_id: enemyId } });
  if (!enemy) throw new Error("Enemy not found");

  const level = await prisma.level.findFirst({
    where: {
      map: { map_name: enemy.enemy_map },
      level_difficulty: enemy.enemy_difficulty as DifficultyLevel,
    },
    include: { challenges: true },
  });
  if (!level) throw new Error("No level found for enemy's map + difficulty");

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
        current_level: 1,
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
    player,
    character: selectedCharacter,
    enemy,
    progress,
    level,
    enemyHealth: responseEnemyHp,
    enemyMaxHealth: scaledEnemyHp,
  };
}

export async function fightEnemy(
  playerId: number,
  enemyId: number,
  isCorrect: boolean,
  elapsedSeconds: number,
  challengeId?: number
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

  let attackType: string | null = null;
  let damage = 0;
  let attackUrl: string | null = null;
  let enemyAttackUrl: string | null = null;
  let enemyHurtUrl: string | null = null;
  let characterHurtUrl: string | null = null;
  let characterDiesUrl: string | null = null;
  let enemyDiesUrl: string | null = null;
  let character_idle: string | null = null;
  let enemy_idle: string | null = null;

  if (isCorrect) {
    await updateQuestProgress(playerId, QuestType.solve_challenge, 1);

    let currentChallenge = null;
    if (challengeId) {
      currentChallenge = await prisma.challenge.findUnique({
        where: { challenge_id: challengeId },
      });
    }

    const correctAnswerLength = currentChallenge
      ? new Set(currentChallenge.correct_answer as string[]).size
      : 1;

    console.log("- Challenge ID:", challengeId);
    console.log("- Correct answer length:", correctAnswerLength);
    console.log("- Elapsed seconds:", elapsedSeconds);

    if (correctAnswerLength >= 4) {
      if (elapsedSeconds < 5) {
        attackType = "special_attack";
        damage = damageArray[2] ?? 25;
        attackUrl = attacksArray[2] || null;
        character_idle = character.avatar_image || null;
      } else if (elapsedSeconds < 10) {
        attackType = "second_attack";
        damage = damageArray[1] ?? 15;
        attackUrl = attacksArray[1] || null;
        character_idle = character.avatar_image || null;
      } else {
        attackType = "basic_attack";
        damage = damageArray[0] ?? 10;
        attackUrl = attacksArray[0] || null;
        character_idle = character.avatar_image || null;
      }
    } else {
      attackType = "basic_attack";
      damage = damageArray[0] ?? 10;
      attackUrl = attacksArray[0] || null;
      character_idle = character.avatar_image || null;
    }

    console.log("- Attack type:", attackType);
    console.log("- Base damage:", damage);

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
      }
    }
  } else {
    if (enemyHealth > 0) {
      let enemyDamage = enemy.enemy_damage ?? 5;

      if (progress.has_freeze_effect) {
        enemyDamage = 0;
        await prisma.playerProgress.update({
          where: { progress_id: progress.progress_id },
          data: { has_freeze_effect: false },
        });
        console.log("- Freeze potion active, enemy attack nullified");
      }

      charHealth = Math.max(charHealth - enemyDamage, 0);
      enemy_idle = enemy.enemy_avatar || null;
      enemyAttackUrl = enemy.enemy_attack || null;
      characterHurtUrl = character.character_hurt || null;
      character_idle = character.avatar_image || null;
      console.log(
        "- Enemy dealt",
        enemyDamage,
        "damage, player health:",
        charHealth
      );

      if (charHealth <= 0) {
        status = BattleStatus.lost;
        characterDiesUrl = character.character_dies || null;
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
    charHealth,
    enemyHealth,
    enemyMaxHealth: scaledEnemyMaxHealth,
    attackType,
    damage,
    attackUrl,
    enemyAttackUrl,
    enemyHurtUrl,
    characterHurtUrl,
    characterDiesUrl,
    enemyDiesUrl,
    enemy_idle,
    character_idle,
    timer: formatTimer(Math.max(0, Math.floor(elapsedSeconds))),
    energy: updatedEnergyStatus.energy,
    timeToNextEnergyRestore: updatedEnergyStatus.timeToNextRestore,
  };
}
