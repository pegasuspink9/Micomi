import { PrismaClient, BattleStatus, DifficultyLevel } from "@prisma/client";
import * as LevelService from "../Levels/levels.service";
import { updateQuestProgress } from "../Quests/quests.service";
import { QuestType } from "@prisma/client";
import { formatTimer } from "../../../helper/dateTimeHelper";
import { CHALLENGE_TIME_LIMIT } from "../../../helper/timeSetter";
import * as EnergyService from "../Energy/energy.service";

const prisma = new PrismaClient();

async function getFightSetup(playerId: number, enemyId: number) {
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
  });

  if (!level)
    throw new Error("No level found matching enemy’s map + difficulty");

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
        player_hp: selectedCharacter.health,
        enemy_hp: enemy.enemy_health,
        battle_status: "in_progress",
        current_level: 1,
        attempts: 0,
        player_answer: {},
        challenge_start_time: new Date(),
      },
    });
  }

  return { player, character: selectedCharacter, enemy, progress };
}

export const fightEnemy = async (
  playerId: number,
  enemyId: number,
  isCorrect: boolean
) => {
  const energyStatus = await EnergyService.updatePlayerEnergy(playerId);
  const { player, character, enemy } = await getFightSetup(playerId, enemyId);

  const level = await prisma.level.findFirst({
    where: {
      map: { map_name: enemy.enemy_map },
      level_difficulty: enemy.enemy_difficulty as DifficultyLevel,
    },
    include: { challenges: true },
  });
  if (!level) throw new Error("No level found for enemy");

  const levelId = level.level_id;

  let progress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
  });
  if (!progress) throw new Error("Missing player progress");

  let charHealth = progress.player_hp ?? character.health;
  let charDamage = character.character_damage;
  let enemyHealth = enemy.enemy_health;
  let enemyDamage = enemy.enemy_damage;

  const wrongChallenges: number[] =
    (progress.wrong_challenges as number[]) ?? [];

  let elapsedSeconds = 0;
  if (progress.challenge_start_time) {
    elapsedSeconds =
      (Date.now() - new Date(progress.challenge_start_time).getTime()) / 1000;
  }
  if (elapsedSeconds > CHALLENGE_TIME_LIMIT) {
    await EnergyService.deductEnergy(playerId, 1);
    charHealth -= enemyDamage;

    let status: BattleStatus = charHealth <= 0 ? "lost" : "in_progress";
    await prisma.playerProgress.update({
      where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
      data: {
        player_hp: Math.max(charHealth, 0),
        battle_status: status,
        challenge_start_time: new Date(),
      },
    });

    return {
      status,
      charHealth: Math.max(charHealth, 0),
      enemyHealth,
      message:
        status === "lost"
          ? "The enemy struck you down!"
          : "Too slow! Enemy attacked.",
      timer: formatTimer(0),
    };
  }

  if (
    progress.battle_status === null ||
    progress.battle_status === "in_progress"
  ) {
    const activePotion = await prisma.playerPotion.findFirst({
      where: { player_id: playerId, quantity: { gt: 0 } },
      include: { potion: true },
    });

    if (activePotion) {
      switch (activePotion.potion.potion_type) {
        case "health":
          charHealth = character.health;
          break;
        case "strong":
          charDamage *= 2;
          break;
        case "freeze":
          enemyDamage = 0;
          break;
      }
      await prisma.playerPotion.update({
        where: { player_potion_id: activePotion.player_potion_id },
        data: { quantity: activePotion.quantity - 1 },
      });
    }
  }

  let status: BattleStatus = "in_progress";

  if (isCorrect) {
    await updateQuestProgress(playerId, QuestType.solve_challenge, 1);
    enemyHealth -= charDamage;

    if (enemyHealth <= 0) {
      const remainingChallenges = level.challenges.filter(
        (c) => !wrongChallenges.includes(c.challenge_id)
      );

      if (remainingChallenges.length === 0) {
        status = "won";
      }
    }
    if (wrongChallenges.length > 0) {
      wrongChallenges.shift();
    }
  } else {
    await EnergyService.deductEnergy(playerId, 1);
    charHealth -= enemyDamage;

    const challenges = level.challenges;
    const currentChallenge =
      challenges[wrongChallenges.length % challenges.length];
    if (!wrongChallenges.includes(currentChallenge.challenge_id)) {
      wrongChallenges.push(currentChallenge.challenge_id);
    }

    status = charHealth <= 0 ? "lost" : "in_progress";

    await prisma.playerProgress.update({
      where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
      data: {
        player_hp: Math.max(charHealth, 0),
        wrong_challenges: wrongChallenges,
        battle_status: status,
      },
    });

    const updatedEnergyStatus = await EnergyService.getPlayerEnergyStatus(
      playerId
    );

    return {
      status,
      charHealth,
      enemyHealth,
      message: "Wrong answer!",
      energy: updatedEnergyStatus.energy,
      timeToNextEnergyRestore: updatedEnergyStatus.timeToNextRestore,
    };
  }

  await prisma.playerProgress.update({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    data: {
      player_hp: Math.max(charHealth, 0),
      battle_status: status,
      wrong_challenges: wrongChallenges,
      is_completed: status === "won" ? true : undefined,
      completed_at: status === "won" ? new Date() : undefined,
      challenge_start_time: new Date(),
    },
  });

  if (status === "won") {
    await updateQuestProgress(playerId, QuestType.defeat_enemy, 1);

    const totalExp = level.challenges.reduce(
      (sum, c) => sum + c.points_reward,
      0
    );
    const totalCoins = level.challenges.reduce(
      (sum, c) => sum + c.coins_reward,
      0
    );

    await prisma.player.update({
      where: { player_id: playerId },
      data: {
        total_points: { increment: totalExp },
        exp_points: { increment: totalExp },
        coins: { increment: totalCoins },
      },
    });

    await LevelService.unlockNextLevel(
      playerId,
      level.map_id,
      level.level_number
    );
  }

  const updatedEnergyStatus = await EnergyService.getPlayerEnergyStatus(
    playerId
  );

  return {
    status,
    charHealth: Math.max(charHealth, 0),
    enemyHealth: Math.max(enemyHealth, 0),
    charDamage,
    enemyDamage,
    wrongChallenges,
    timer: formatTimer(Math.max(0, CHALLENGE_TIME_LIMIT - elapsedSeconds)),
    energy: updatedEnergyStatus.energy,
    timeToNextEnergyRestore: updatedEnergyStatus.timeToNextRestore,
  };
};

export const fightBossEnemy = async (
  playerId: number,
  enemyId: number,
  isCorrect: boolean
) => {
  const { player, character, enemy } = await getFightSetup(playerId, enemyId);

  const level = await prisma.level.findFirst({
    where: {
      map: { map_name: enemy.enemy_map },
      level_difficulty: enemy.enemy_difficulty as DifficultyLevel,
    },
    include: { challenges: true },
  });

  if (!level) throw new Error("No level found for enemy");

  const levelId = level.level_id;

  const progress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    include: { level: { include: { challenges: true } } },
  });

  if (!progress) throw new Error("Missing player progress");

  const invalid = progress.level.challenges.some((c) => !c.guide);
  if (invalid)
    throw new Error("All Hard level challenges must include a guide");

  let charHealth = progress.player_hp ?? character.health;
  let enemyHealth =
    progress.enemy_hp ??
    enemy.enemy_health *
      (await prisma.challenge.count({ where: { level_id: levelId } }));
  let charDamage = character.character_damage;
  let enemyDamage = enemy.enemy_damage;

  let wrongChallenges: number[] = (progress.wrong_challenges as number[]) ?? [];

  if (!progress.battle_status || progress.battle_status === "in_progress") {
    const activePotion = await prisma.playerPotion.findFirst({
      where: { player_id: playerId, quantity: { gt: 0 } },
      include: { potion: true },
    });

    if (activePotion) {
      switch (activePotion.potion.potion_type) {
        case "health":
          charHealth = character.health;
          break;
        case "strong":
          charDamage *= 2;
          break;
        case "freeze":
          enemyDamage = 0;
          break;
      }
      await prisma.playerPotion.update({
        where: { player_potion_id: activePotion.player_potion_id },
        data: { quantity: activePotion.quantity - 1 },
      });
    }
  }

  let message = "";
  if (isCorrect) {
    await updateQuestProgress(playerId, QuestType.solve_challenge, 1);
    enemyHealth -= charDamage;

    if (wrongChallenges.length > 0) wrongChallenges.shift();
    message = "Correct! You attacked the enemy.";
  } else {
    await EnergyService.deductEnergy(playerId, 1);

    const challenges = progress.level.challenges;
    const totalChallenges = challenges.length;
    const answeredCount =
      (enemy.enemy_health * totalChallenges - enemyHealth) / charDamage;
    const currentChallenge = challenges[answeredCount % totalChallenges];

    if (!wrongChallenges.includes(currentChallenge.challenge_id)) {
      wrongChallenges.push(currentChallenge.challenge_id);
    }

    charHealth -= enemyDamage;
    message = "Wrong answer! Enemy attacked you.";
  }

  let status: BattleStatus = "in_progress";
  if (enemyHealth <= 0 && wrongChallenges.length === 0) status = "won";
  if (charHealth <= 0) status = "lost";

  const updatedProgress = await prisma.playerProgress.update({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    data: {
      enemy_hp: Math.max(enemyHealth, 0),
      player_hp: Math.max(charHealth, 0),
      battle_status: status,
      challenge_start_time: new Date(),
      wrong_challenges: wrongChallenges,
      is_completed: status === "lost" ? false : progress.is_completed,
    },
    include: { level: { include: { challenges: true } } },
  });

  if (status === "won" && !progress.is_completed) {
    await updateQuestProgress(playerId, QuestType.defeat_enemy, 1);

    const totalExp = updatedProgress.level.challenges.reduce(
      (sum, c) => sum + c.points_reward,
      0
    );
    const totalCoins = updatedProgress.level.challenges.reduce(
      (sum, c) => sum + c.coins_reward,
      0
    );

    await prisma.player.update({
      where: { player_id: playerId },
      data: {
        total_points: { increment: totalExp },
        exp_points: { increment: totalExp },
        coins: { increment: totalCoins },
      },
    });

    await LevelService.unlockNextLevel(
      playerId,
      level.map_id,
      level.level_number
    );

    if (level.level_type === "final") {
      const nextMap = await prisma.map.findFirst({
        where: { map_id: { gt: level.map_id }, is_active: false },
        orderBy: { map_id: "asc" },
      });
      if (nextMap) {
        await prisma.map.update({
          where: { map_id: nextMap.map_id },
          data: { is_active: true },
        });
      }
    }
  }

  const updatedEnergyStatus = await EnergyService.getPlayerEnergyStatus(
    playerId
  );

  return {
    status,
    charHealth: Math.max(charHealth, 0),
    enemyHealth: Math.max(enemyHealth, 0),
    charDamage,
    enemyDamage,
    wrongChallenges,
    message,
    energy: updatedEnergyStatus.energy,
    timeToNextEnergyRestore: updatedEnergyStatus.timeToNextRestore,
  };
};
