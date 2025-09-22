import { PrismaClient, PotionType, QuestType } from "@prisma/client";
import { updateQuestProgress } from "../Quests/quests.service";

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

export const buyPotion = async (playerId: number, potionShopId: number) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!player) throw new Error("Player not found");

  const potion = await prisma.potionShop.findUnique({
    where: { potion_shop_id: potionShopId },
  });
  if (!potion) throw new Error("Potion not found");

  if (player.coins < potion.potion_price) throw new Error("Not enough coins");

  const existing = await prisma.playerPotion.findUnique({
    where: {
      player_id_potion_shop_id: {
        player_id: playerId,
        potion_shop_id: potionShopId,
      },
    },
  });

  if (existing) {
    await prisma.playerPotion.update({
      where: {
        player_id_potion_shop_id: {
          player_id: playerId,
          potion_shop_id: potionShopId,
        },
      },
      data: { quantity: { increment: 1 } },
    });
  } else {
    await prisma.playerPotion.create({
      data: { player_id: playerId, potion_shop_id: potionShopId, quantity: 1 },
    });
  }

  await prisma.player.update({
    where: { player_id: playerId },
    data: { coins: { decrement: potion.potion_price } },
  });

  await updateQuestProgress(playerId, QuestType.buy_potion, 1);
  await spendCoins(playerId, potion.potion_price);

  return { message: `${potion.potion_type} purchased` };
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
  potionType: PotionType,
  levelId: number
) => {
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
      potion: { potion_type: potionType },
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
      // already handled in challenges.service.ts specifically in submitChallenge function
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
  };
};
