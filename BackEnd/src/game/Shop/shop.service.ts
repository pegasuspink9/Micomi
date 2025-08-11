import { PrismaClient, Prisma, PotionType } from "@prisma/client";
import { InventoryItem } from "../../models/Shop/shop.types";

const prisma = new PrismaClient();

export const buyItem = async (
  playerId: number,
  shopId: number,
  itemType: string
) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });

  const shop = await prisma.shop.findUnique({
    where: { shop_id: shopId },
    include: { character: true },
  });

  if (!player || !shop) throw new Error("Player or shop not found");
  if (!shop.is_active) throw new Error("Shop is not active");

  let cost: number;

  if (itemType === "potion") {
    if (
      shop.potion_price == null ||
      shop.potion_type == null ||
      shop.potion_health_boost == null
    ) {
      throw new Error("Shop missing potion fields");
    }
    cost = shop.potion_price;
  } else if (itemType === "character") {
    if (shop.character_id == null || shop.character_price == null) {
      throw new Error("Shop missing character fields");
    }
    cost = shop.character_price;
  } else {
    throw new Error("Invalid item type");
  }

  if (player.coins < cost) throw new Error("Insufficient coins");

  const inventory: InventoryItem[] =
    (player.inventory as unknown as InventoryItem[]) || [];

  if (itemType === "potion") {
    const existing = inventory.find(
      (item) => item.type === "potion" && item.name === shop.potion_type
    );

    if (existing) {
      existing.quantity = (existing.quantity || 0) + 1;
    } else {
      inventory.push({
        type: "potion",
        name: shop.potion_type!,
        quantity: 1,
        healthBoost: shop.potion_health_boost!,
      });
    }

    await prisma.$transaction([
      prisma.player.update({
        where: { player_id: playerId },
        data: {
          coins: { decrement: shop.potion_price! },
          inventory: inventory as any,
        },
      }),
    ]);
  } else if (itemType === "character") {
    const character = shop.character;
    if (!character) throw new Error("Character not found");

    const existing = inventory.find(
      (item) =>
        item.type === "character" && item.character_id === shop.character_id
    );
    if (existing && existing.is_purchased) {
      throw new Error("Character already purchased");
    }

    inventory.forEach((item) => {
      if (item.type === "character") {
        item.is_selected = item.character_id === shop.character_id;
      }
    });
    inventory.push({
      type: "character",
      name: character.character_name,
      character_id: shop.character_id!,
      is_purchased: true,
      is_selected: true,
    });
    await prisma.$transaction([
      prisma.player.update({
        where: { player_id: playerId },
        data: {
          coins: { decrement: shop.character_price! },
          inventory: inventory as any,
        },
      }),
      prisma.character.update({
        where: { character_id: shop.character_id! },
        data: { is_purchased: true, is_selected: true },
      }),
      prisma.character.updateMany({
        where: { character_id: { not: shop.character_id! } },
        data: { is_selected: false },
      }),
    ]);
  }

  const quests = await prisma.quest.findMany({
    where: {
      player_id: playerId,
      is_completed: false,
      objective_type: itemType === "potion" ? "buy_potion" : "unlock_character",
    },
  });

  for (const quest of quests) {
    const newValue = (quest.current_value || 0) + 1;
    await prisma.quest.update({
      where: { quest_id: quest.quest_id },
      data: {
        current_value: newValue,
        is_completed: newValue >= quest.target_value,
        completed_at: newValue >= quest.target_value ? new Date() : undefined,
      },
    });
  }

  return { message: `${itemType} purchased` };
};

export const usePotion = async (
  playerId: number,
  characterId: number,
  potionName: string
) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  const character = await prisma.character.findUnique({
    where: { character_id: characterId },
  });

  if (!player) throw new Error("Player not found");
  if (!character) throw new Error("Character not found");

  const inventory: InventoryItem[] =
    (player.inventory as unknown as InventoryItem[]) || [];

  const characterInInventory = inventory.find(
    (item) =>
      item.type === "character" &&
      item.character_id === characterId &&
      item.is_purchased
  );
  if (!characterInInventory) throw new Error("Character not owned by player");

  const activePotion = inventory.find(
    (item) =>
      item.type === "potion" &&
      item.name === potionName &&
      (item.quantity || 0) > 0
  );
  if (!activePotion) throw new Error("No potions available");

  activePotion.quantity = (activePotion.quantity || 1) - 1;
  const updatedInventory = inventory.filter((item) => item.quantity !== 0);

  const updates: (
    | Prisma.PrismaPromise<Prisma.PlayerGetPayload<{}>>
    | Prisma.PrismaPromise<Prisma.CharacterGetPayload<{}>>
  )[] = [
    prisma.player.update({
      where: { player_id: playerId },
      data: { inventory: updatedInventory as any },
    }),
  ];

  switch (potionName as PotionType) {
    case "health": {
      const currentHealth = character.health || 0;
      const healthBoost = activePotion.healthBoost || 0;
      updates.push(
        prisma.character.update({
          where: { character_id: characterId },
          data: { health: currentHealth + healthBoost },
        })
      );
      break;
    }

    case "strong":
      updatedInventory.push({
        type: "potion",
        name: "strong_effect",
        quantity: 1,
        healthBoost: 0,
      });
      updates.push(
        prisma.player.update({
          where: { player_id: playerId },
          data: { inventory: updatedInventory as any },
        })
      );
      break;

    case "freeze":
      updatedInventory.push({
        type: "potion",
        name: "freeze_effect",
        quantity: 1,
        healthBoost: 0,
      });
      updates.push(
        prisma.player.update({
          where: { player_id: playerId },
          data: { inventory: updatedInventory as any },
        })
      );
      break;

    default:
      throw new Error("Invalid potion type");
  }

  await prisma.$transaction(updates);

  return { message: `${potionName} potion used` };
};
