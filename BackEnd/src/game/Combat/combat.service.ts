import { PrismaClient, BattleStatus } from "@prisma/client";
import * as LevelService from "../Levels/levels.service";
import { InventoryItem } from "../../models/Shop/shop.types";
import { getSelectedCharacterId } from "../Characters/characters.service";
import { updateQuestProgress } from "../Quests/quests.service";
import { QuestType } from "@prisma/client";

const prisma = new PrismaClient();

async function getFightSetup(playerId: number, enemyId: number) {
  const characterId = await getSelectedCharacterId(playerId);
  if (!characterId) throw new Error("No selected character found");

  const [player, character, enemy] = await Promise.all([
    prisma.player.findUnique({ where: { player_id: playerId } }),
    prisma.character.findUnique({ where: { character_id: characterId } }),
    prisma.enemy.findUnique({ where: { enemy_id: enemyId } }),
  ]);

  if (!player || !character || !enemy) {
    throw new Error("Invalid character, enemy, or player");
  }

  return { player, character, enemy, characterId };
}

export const fightEnemy = async (
  playerId: number,
  enemyId: number,
  isCorrect: boolean
) => {
  const { player, character, enemy, characterId } = await getFightSetup(
    playerId,
    enemyId
  );
  const levelId = enemy.level_id;

  const progress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
  });
  if (!progress) throw new Error("Missing player progress");

  const inventory: InventoryItem[] = (player.inventory as any) || [];
  const characterInInventory = inventory.find(
    (item) =>
      item.type === "character" &&
      item.character_id === characterId &&
      item.is_purchased
  );
  if (!characterInInventory) throw new Error("Character not owned by player");

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
    const activePotion = inventory.find(
      (item) => item.type === "potion" && (item.quantity || 0) > 0
    );
    if (activePotion) {
      switch (activePotion.name) {
        case "health":
          charHealth += activePotion.healthBoost || 0;
          break;
        case "strong":
          charDamage *= 2;
          break;
        case "freeze":
          enemyDamage = 0;
          break;
      }
      activePotion.quantity = (activePotion.quantity || 1) - 1;
      const updatedInventory = inventory.filter((item) => item.quantity !== 0);
      await prisma.player.update({
        where: { player_id: playerId },
        data: { inventory: updatedInventory as any },
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
      await prisma.lesson.updateMany({
        where: { level_id: levelId },
        data: { is_unlocked: true },
      });
    }
  }

  return {
    status,
    charHealth: Math.max(charHealth, 0),
    enemyHealth: Math.max(enemyHealth, 0),
  };
};

export const fightBossEnemy = async (
  playerId: number,
  enemyId: number,
  correctCount: number,
  totalCount: number
) => {
  const { player, character, enemy, characterId } = await getFightSetup(
    playerId,
    enemyId
  );
  const levelId = enemy.level_id;

  const progress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
  });
  if (!progress) throw new Error("Missing player progress");

  let charHealth = progress.player_hp ?? character.health;
  let enemyHealth = progress.enemy_hp ?? enemy.enemy_health;
  const charDamage = correctCount * 10;
  const enemyDamage = (totalCount - correctCount) * 10;

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
