import { PrismaClient, PotionType, QuestType } from "@prisma/client";
import { updateQuestProgress } from "game/Quests/quests.service";

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

//Still need to finalize!!!
export const usePotion = async (playerId: number, potionType: PotionType) => {
  // Get selected character
  const playerCharacter = await prisma.playerCharacter.findFirst({
    where: { player_id: playerId, is_selected: true, is_purchased: true },
    include: { character: true },
  });
  if (!playerCharacter) throw new Error("No selected character found");

  // Get the potion in player's inventory
  const playerPotion = await prisma.playerPotion.findUnique({
    where: {
      player_id_potion_shop_id: {
        player_id: playerId,
        potion_shop_id: potionType as unknown as number, // map enum to shop ID if needed
      },
    },
  });
  if (!playerPotion || playerPotion.quantity <= 0)
    throw new Error("Potion not available");

  // Apply potion effect
  const updates: any[] = [];

  switch (potionType) {
    case "health":
      updates.push(
        prisma.character.update({
          where: { character_id: playerCharacter.character_id },
          data: { health: playerCharacter.character.health },
        })
      );
      break;
    case "strong":
      updates.push(
        prisma.character.update({
          where: { character_id: playerCharacter.character_id },
          data: {
            character_damage: playerCharacter.character.character_damage * 2,
          },
        })
      );
      break;
    case "freeze":
      // Freeze effect: you might store it in PlayerCharacter table for the battle session
      updates.push(
        prisma.playerCharacter.update({
          where: { player_character_id: playerCharacter.player_character_id },
          data: {
            /* you can add a "status_effect" field if needed */
          },
        })
      );
      break;
  }

  // Decrement potion quantity
  updates.push(
    prisma.playerPotion.update({
      where: { player_potion_id: playerPotion.player_potion_id },
      data: { quantity: { decrement: 1 } },
    })
  );

  await prisma.$transaction(updates);

  return {
    message: `${potionType} potion applied to ${playerCharacter.character.character_name}`,
  };
};
