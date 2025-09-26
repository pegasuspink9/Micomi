import { PrismaClient, PotionType, QuestType } from "@prisma/client";
import { updateQuestProgress } from "../Quests/quests.service";
import { previewLevel } from "../Levels/levels.service";

const prisma = new PrismaClient();

async function spendCoins(playerId: number, amount: number) {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!player) throw new Error("Player not found");
  if (player.coins < amount) throw new Error("Not enough coins");

  await prisma.player.update({
    where: { player_id: playerId },
    data: { coins: { decrement: amount } },
  });

  await updateQuestProgress(playerId, QuestType.spend_coins, amount);
}

export const buyPotion = async (
  playerId: number,
  levelId: number,
  potionId: number
) => {
  // Fetch potion to get type and price
  const potion = await prisma.potionShop.findUnique({
    where: { potion_shop_id: potionId },
  });
  if (!potion) throw new Error("Potion not found");

  const potionType = potion.potion_type;

  // Check level has shop config
  const potionConfig = await prisma.potionShopByLevel.findUnique({
    where: { level_id: levelId },
  });
  if (!potionConfig)
    throw new Error("No potion shop configured for this level");

  // Check if available in this level (via limit or potions_avail)
  const rawLimit =
    potionConfig[
      `${potionType.toLowerCase()}_quantity` as keyof typeof potionConfig
    ] ?? 0;
  const maxAllowed = Number(rawLimit);
  if (maxAllowed === 0) {
    const potionsAvail = potionConfig.potions_avail as string[];
    if (!potionsAvail.includes(potionType)) {
      throw new Error(`${potionType} not available in this level`);
    }
  }

  // Check per-level buys (enforce limit)
  const playerLevelPotion = await prisma.playerLevelPotion.findUnique({
    where: {
      player_id_level_id_potion_shop_id: {
        player_id: playerId,
        level_id: levelId,
        potion_shop_id: potionId,
      },
    },
  });

  const levelBought = playerLevelPotion?.quantity ?? 0;
  if (levelBought >= maxAllowed) {
    throw new Error(
      `Limit reached: ${maxAllowed} ${potionType} potions for this level`
    );
  }

  // Check coins
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!player) throw new Error("Player not found");
  if (player.coins < potion.potion_price) throw new Error("Not enough coins");

  // Atomic transaction: buy per-level, add to global, spend coins
  await prisma.$transaction(async (tx) => {
    await tx.playerLevelPotion.upsert({
      where: {
        player_id_level_id_potion_shop_id: {
          player_id: playerId,
          level_id: levelId,
          potion_shop_id: potionId,
        },
      },
      update: { quantity: { increment: 1 } },
      create: {
        player_id: playerId,
        level_id: levelId,
        potion_shop_id: potionId,
        quantity: 1,
      },
    });

    await tx.playerPotion.upsert({
      where: {
        player_id_potion_shop_id: {
          player_id: playerId,
          potion_shop_id: potionId,
        },
      },
      update: { quantity: { increment: 1 } },
      create: {
        player_id: playerId,
        potion_shop_id: potionId,
        quantity: 1,
      },
    });

    await tx.player.update({
      where: { player_id: playerId },
      data: { coins: { decrement: potion.potion_price } },
    });
  });

  // Post-transaction: update quests
  await updateQuestProgress(playerId, QuestType.buy_potion, 1);

  // Return updated preview (shows new remaining=0 if limit hit)
  return await previewLevel(playerId, levelId);
};

export const buyCharacter = async (
  playerId: number,
  characterShopId: number
) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!player) throw new Error("Player not found");

  const charShop = await prisma.characterShop.findUnique({
    where: { character_shop_id: characterShopId },
    include: { character: true },
  });
  if (!charShop) throw new Error("Character not found");

  if (player.coins < charShop.character_price)
    throw new Error("Not enough coins");

  const existing = await prisma.playerCharacter.findUnique({
    where: {
      player_id_character_id: {
        player_id: playerId,
        character_id: charShop.character_id,
      },
    },
  });

  if (existing?.is_purchased) throw new Error("Character already purchased");

  await prisma.playerCharacter.updateMany({
    where: { player_id: playerId },
    data: { is_selected: false },
  });

  await prisma.playerCharacter.upsert({
    where: {
      player_id_character_id: {
        player_id: playerId,
        character_id: charShop.character_id,
      },
    },
    update: { is_purchased: true, is_selected: true },
    create: {
      player_id: playerId,
      character_id: charShop.character_id,
      is_purchased: true,
      is_selected: true,
    },
  });

  await prisma.player.update({
    where: { player_id: playerId },
    data: { coins: { decrement: charShop.character_price } },
  });

  await updateQuestProgress(playerId, QuestType.unlock_character, 1);
  await spendCoins(playerId, charShop.character_price);

  return { message: `${charShop.character.character_name} purchased` };
};

export const usePotion = async (
  playerId: number,
  levelId: number,
  potionId: number
) => {
  const potionShop = await prisma.potionShop.findUnique({
    where: { potion_shop_id: potionId },
  });
  if (!potionShop) throw new Error("Potion not found");

  const potionType = potionShop.potion_type;

  const progress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    include: {
      player: {
        include: {
          ownedCharacters: {
            where: { is_selected: true, is_purchased: true },
            include: { character: true },
          },
        },
      },
    },
  });
  if (!progress) throw new Error("No active progress found for this level");

  const playerPotion = await prisma.playerPotion.findFirst({
    where: {
      player_id: playerId,
      potion_shop_id: potionId,
      quantity: { gt: 0 },
    },
    include: { potion: true },
  });
  if (!playerPotion) throw new Error("Potion not available");

  const updates: any[] = [];

  switch (potionType) {
    case "health":
      updates.push(
        prisma.playerProgress.update({
          where: { progress_id: progress.progress_id },
          data: {
            player_hp:
              progress.player.ownedCharacters[0]?.character.health ??
              progress.player_hp,
          },
        })
      );
      break;

    case "strong":
      updates.push(
        prisma.playerProgress.update({
          where: { progress_id: progress.progress_id },
          data: { has_strong_effect: true },
        })
      );
      break;

    case "freeze":
      updates.push(
        prisma.playerProgress.update({
          where: { progress_id: progress.progress_id },
          data: { has_freeze_effect: true },
        })
      );
      break;

    case "hint":
      // handled separately in challenges.service
      break;
  }

  updates.push(
    prisma.playerPotion.update({
      where: { player_potion_id: playerPotion.player_potion_id },
      data: { quantity: { decrement: 1 } },
    })
  );

  await prisma.$transaction(updates);

  return {
    message: `${potionType} potion used`,
    potionType,
    remaining: playerPotion.quantity - 1,
  };
};
