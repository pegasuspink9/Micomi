import { PrismaClient, BattleStatus } from "@prisma/client";
import * as LevelService from "../Levels/levels.service";
import { updateQuestProgress } from "../Quests/quests.service";
import { QuestType } from "@prisma/client";
import { formatTimer } from "../../../helper/dateTimeHelper";

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

  let progress = await prisma.playerProgress.findUnique({
    where: {
      player_id_level_id: { player_id: playerId, level_id: enemy.level_id },
    },
  });

  if (!progress) {
    progress = await prisma.playerProgress.create({
      data: {
        player_id: playerId,
        level_id: enemy.level_id,
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
  const { player, character, enemy } = await getFightSetup(playerId, enemyId);
  const levelId = enemy.level_id;

  const progress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    include: { level: { include: { challenges: true } } },
  });
  if (!progress) throw new Error("Missing player progress");

  let elapsedSeconds = 0;
  if (progress.challenge_start_time) {
    elapsedSeconds =
      (Date.now() - new Date(progress.challenge_start_time).getTime()) / 1000;
  }

  if (elapsedSeconds > 10) {
    await prisma.playerProgress.update({
      where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
      data: { player_hp: 0, battle_status: "lost" },
    });

    return {
      status: "lost",
      charHealth: 0,
      enemyHealth: progress.enemy_hp ?? enemy.enemy_health,
      message: "Time's up! The enemy ate your character.",
      timer: formatTimer(elapsedSeconds),
    };
  }

  const currentChallenge = progress.level.challenges[0];
  if (
    currentChallenge &&
    (currentChallenge.challenge_type === "multiple choice" ||
      currentChallenge.challenge_type === "fill in the blank") &&
    progress.challenge_start_time
  ) {
    const elapsedSeconds =
      (Date.now() - new Date(progress.challenge_start_time).getTime()) / 1000;
    if (elapsedSeconds > 10) {
      await prisma.playerProgress.update({
        where: {
          player_id_level_id: { player_id: playerId, level_id: levelId },
        },
        data: {
          player_hp: 0,
          battle_status: "lost",
        },
      });
      return {
        status: "lost",
        charHealth: 0,
        enemyHealth: progress.enemy_hp ?? enemy.enemy_health,
        message: "Time's up! The enemy ate your character.",
      };
    }
  }

  let charHealth = progress.player_hp ?? character.health;
  let enemyHealth =
    progress.enemy_hp ??
    enemy.enemy_health *
      (await prisma.challenge.count({ where: { level_id: levelId } }));
  let charDamage = character.character_damage;
  let enemyDamage = enemy.enemy_damage;

  if (
    progress.battle_status === null ||
    progress.battle_status === "in_progress"
  ) {
    const activePotion = await prisma.playerPotion.findFirst({
      where: {
        player_id: playerId,
        quantity: { gt: 0 },
      },
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

  if (isCorrect) {
    await updateQuestProgress(playerId, QuestType.solve_challenge, 1);
    enemyHealth -= charDamage;
  } else {
    charHealth -= enemyDamage;
  }

  let status: BattleStatus = "in_progress";
  if (enemyHealth <= 0) status = "won";
  if (charHealth <= 0) status = "lost";

  await prisma.playerProgress.update({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    data: {
      enemy_hp: Math.max(enemyHealth, 0),
      player_hp: Math.max(charHealth, 0),
      battle_status: status,
      challenge_start_time: new Date(),
    },
  });

  if (status === "won") {
    await updateQuestProgress(playerId, QuestType.defeat_enemy, 1);

    await prisma.playerProgress.update({
      where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
      data: { is_completed: true, completed_at: new Date() },
    });

    await prisma.player.update({
      where: { player_id: playerId },
      data: { total_points: { increment: 50 }, exp_points: { increment: 50 } },
    });

    if (player.exp_points + 50 >= 100) {
      await prisma.player.update({
        where: { player_id: playerId },
        data: { level: { increment: 1 }, exp_points: { decrement: 100 } },
      });
    }

    const level = await prisma.level.findUnique({
      where: { level_id: levelId },
    });
    if (level) {
      await LevelService.unlockNextLevel(
        playerId,
        level.map_id,
        level.level_number
      );
    }
  }

  return {
    status,
    charHealth: Math.max(charHealth, 0),
    enemyHealth: Math.max(enemyHealth, 0),
    charDamage,
    enemyDamage,
    timer: formatTimer(elapsedSeconds),
  };
};

export const fightMediumEnemy = async (
  playerId: number,
  enemyId: number,
  isCorrect: boolean
) => {
  const { player, character, enemy } = await getFightSetup(playerId, enemyId);
  const levelId = enemy.level_id;

  const progress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    include: { level: { include: { challenges: true } } },
  });
  if (!progress) throw new Error("Missing player progress");

  const invalid = progress.level.challenges.some((c) => !c.guide);
  if (invalid) {
    throw new Error("All Medium level challenges must include a guide");
  }

  let charHealth = progress.player_hp ?? character.health;
  let enemyHealth =
    progress.enemy_hp ??
    enemy.enemy_health *
      (await prisma.challenge.count({ where: { level_id: levelId } }));
  let charDamage = character.character_damage;
  let enemyDamage = enemy.enemy_damage;

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

  if (isCorrect) {
    await updateQuestProgress(playerId, QuestType.solve_challenge, 1);
    enemyHealth -= charDamage;
  } else {
    charHealth -= enemyDamage;
  }

  let status: BattleStatus = "in_progress";
  if (enemyHealth <= 0) status = "won";
  if (charHealth <= 0) status = "lost";

  await prisma.playerProgress.update({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    data: {
      enemy_hp: Math.max(enemyHealth, 0),
      player_hp: Math.max(charHealth, 0),
      battle_status: status,
      challenge_start_time: new Date(),
    },
  });

  if (status === "won") {
    await updateQuestProgress(playerId, QuestType.defeat_enemy, 1);

    await prisma.playerProgress.update({
      where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
      data: { is_completed: true, completed_at: new Date() },
    });

    await prisma.player.update({
      where: { player_id: playerId },
      data: { total_points: { increment: 50 }, exp_points: { increment: 50 } },
    });

    if (player.exp_points + 50 >= 100) {
      await prisma.player.update({
        where: { player_id: playerId },
        data: { level: { increment: 1 }, exp_points: { decrement: 100 } },
      });
    }

    const level = await prisma.level.findUnique({
      where: { level_id: levelId },
    });
    if (level) {
      await LevelService.unlockNextLevel(
        playerId,
        level.map_id,
        level.level_number
      );
    }
  }

  return {
    status,
    charHealth: Math.max(charHealth, 0),
    enemyHealth: Math.max(enemyHealth, 0),
    charDamage,
    enemyDamage,
  };
};

export const fightBossEnemy = async (
  playerId: number,
  enemyId: number,
  correctCount: number,
  totalCount: number
) => {
  const { player, character, enemy } = await getFightSetup(playerId, enemyId);
  const levelId = enemy.level_id;

  const progress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
  });
  if (!progress) throw new Error("Missing player progress");

  let charHealth = progress.player_hp ?? character.health;
  let enemyHealth = progress.enemy_hp ?? enemy.enemy_health;
  let charDamage = correctCount * 10;
  let enemyDamage = (totalCount - correctCount) * 10;

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

  enemyHealth -= charDamage;
  if (enemyHealth > 0) charHealth -= enemyDamage;

  let status: BattleStatus = "in_progress";
  if (enemyHealth <= 0) status = "won";
  if (charHealth <= 0) status = "lost";

  await prisma.playerProgress.update({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    data: {
      enemy_hp: Math.max(enemyHealth, 0),
      player_hp: Math.max(charHealth, 0),
      battle_status: status,
    },
  });

  if (status === "won") {
    await updateQuestProgress(playerId, QuestType.defeat_enemy, 1);

    await prisma.playerProgress.update({
      where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
      data: { is_completed: true, completed_at: new Date() },
    });

    await prisma.player.update({
      where: { player_id: playerId },
      data: { total_points: { increment: 50 }, exp_points: { increment: 50 } },
    });

    if (player.exp_points + 50 >= 100) {
      await prisma.player.update({
        where: { player_id: playerId },
        data: { level: { increment: 1 }, exp_points: { decrement: 100 } },
      });
    }

    const level = await prisma.level.findUnique({
      where: { level_id: levelId },
    });
    if (level?.level_type === "final") {
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

  return {
    status,
    charHealth: Math.max(charHealth, 0),
    enemyHealth: Math.max(enemyHealth, 0),
    charDamage,
    enemyDamage,
  };
};
