import { Prisma, BattleStatus } from "@prisma/client";
import { STORE_CATALOG, StoreCatalogItem } from "../Shop/shop.catalog";

type FulfillmentResult = {
  coinsAdded: number;
  diamondsAdded: number;
  unlockedMaps: string[];
  unlockedCharacters: string[];
  infiniteEnergyMonthlyExpiresAt: Date | null;
  infiniteEnergyLifetime: boolean;
};

const MONTHLY_ENERGY_DAYS = 30;

export const resolveCatalogItemByProductId = (
  productId: string,
): StoreCatalogItem | null => {
  return (
    STORE_CATALOG.find((item) => item.google_product_id === productId) ||
    STORE_CATALOG.find((item) => item.item_id === productId) ||
    null
  );
};

const getMapNameForItemId = (itemId: string): string | null => {
  const mapMap: Record<string, string> = {
    map_css_premium: "CSS",
    map_js_premium: "JavaScript",
  };

  return mapMap[itemId] || null;
};

const getCharacterNameForItemId = (itemId: string): string | null => {
  if (!itemId.startsWith("character_")) return null;
  const rawName = itemId.replace("character_", "");
  return rawName.replace(/_/g, " ");
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const unlockMapForPlayer = async (
  tx: Prisma.TransactionClient,
  playerId: number,
  mapName: string,
): Promise<boolean> => {
  const map = await tx.map.findUnique({
    where: { map_name: mapName },
  });

  if (!map) return false;

  const existingProgress = await tx.playerProgress.findFirst({
    where: { player_id: playerId, level: { map_id: map.map_id } },
    select: { progress_id: true },
  });

  if (existingProgress) return false;

  const firstLevel = await tx.level.findFirst({
    where: { map_id: map.map_id },
    orderBy: [{ level_number: "asc" }, { level_id: "asc" }],
  });

  if (!firstLevel) return false;

  if (!map.is_active) {
    await tx.map.update({
      where: { map_id: map.map_id },
      data: { is_active: true, last_updated: new Date() },
    });
  }

  await tx.playerProgress.upsert({
    where: {
      player_id_level_id: {
        player_id: playerId,
        level_id: firstLevel.level_id,
      },
    },
    update: {},
    create: {
      player_id: playerId,
      level_id: firstLevel.level_id,
      current_level: firstLevel.level_number,
      attempts: 0,
      player_answer: {},
      completed_at: null,
      challenge_start_time: new Date(),
      player_hp: 0,
      enemy_hp: 0,
      battle_status: BattleStatus.in_progress,
      is_completed: false,
      wrong_challenges: [],
      coins_earned: 0,
      total_points_earned: 0,
      total_exp_points_earned: 0,
      consecutive_corrects: 0,
      consecutive_wrongs: 0,
      wrong_challenges_count: 0,
      has_reversed_curse: false,
      has_boss_shield: false,
      has_force_character_attack_type: false,
      has_both_hp_decrease: false,
      has_permuted_ss: false,
      has_dollar_sign_ss: false,
      has_only_blanks_ss: false,
      has_reverse_words_ss: false,
      boss_skill_activated: false,
      has_shuffle_ss: false,
      took_damage: false,
      has_strong_effect: false,
      has_freeze_effect: false,
      has_ryron_reveal: false,
      ...(firstLevel.level_type === "micomiButton"
        ? { done_micomi_level: false }
        : {}),
    },
  });

  return true;
};

export const applyCatalogPurchase = async (
  tx: Prisma.TransactionClient,
  playerId: number,
  catalogItem: StoreCatalogItem,
): Promise<FulfillmentResult> => {
  const player = await tx.player.findUnique({
    where: { player_id: playerId },
    select: {
      player_id: true,
      has_infinite_energy: true,
      infinite_energy_expires_at: true,
    },
  });

  if (!player) {
    throw new Error("Player not found");
  }

  const result: FulfillmentResult = {
    coinsAdded: 0,
    diamondsAdded: 0,
    unlockedMaps: [],
    unlockedCharacters: [],
    infiniteEnergyMonthlyExpiresAt: null,
    infiniteEnergyLifetime: false,
  };

  const playerUpdateData: Prisma.PlayerUpdateInput = {};

  for (const content of catalogItem.contents) {
    if (content.item_id === "coins") {
      result.coinsAdded += content.qty;
      playerUpdateData.coins = {
        increment: (playerUpdateData.coins as any)?.increment
          ? (playerUpdateData.coins as any).increment + content.qty
          : content.qty,
      };
      continue;
    }

    if (content.item_id === "diamonds") {
      result.diamondsAdded += content.qty;
      playerUpdateData.diamonds = {
        increment: (playerUpdateData.diamonds as any)?.increment
          ? (playerUpdateData.diamonds as any).increment + content.qty
          : content.qty,
      };
      continue;
    }

    if (content.item_id === "infinite_energy_lifetime") {
      playerUpdateData.has_infinite_energy = true;
      playerUpdateData.infinite_energy_expires_at = null;
      result.infiniteEnergyLifetime = true;
      continue;
    }

    if (content.item_id === "infinite_energy_monthly") {
      if (!player.has_infinite_energy) {
        const now = new Date();
        const baseDate =
          player.infinite_energy_expires_at &&
          player.infinite_energy_expires_at > now
            ? player.infinite_energy_expires_at
            : now;
        const nextExpiry = addDays(baseDate, MONTHLY_ENERGY_DAYS);
        playerUpdateData.infinite_energy_expires_at = nextExpiry;
        result.infiniteEnergyMonthlyExpiresAt = nextExpiry;
      }
      continue;
    }

    const mapName = getMapNameForItemId(content.item_id);
    if (mapName) {
      const unlocked = await unlockMapForPlayer(tx, playerId, mapName);
      if (unlocked) result.unlockedMaps.push(mapName);
      continue;
    }

    const characterName = getCharacterNameForItemId(content.item_id);
    if (characterName) {
      const character = await tx.character.findFirst({
        where: {
          character_name: { equals: characterName, mode: "insensitive" },
        },
      });

      if (!character) {
        throw new Error(`Unknown character: ${content.item_id}`);
      }

      await tx.playerCharacter.upsert({
        where: {
          player_id_character_id: {
            player_id: playerId,
            character_id: character.character_id,
          },
        },
        update: { is_purchased: true },
        create: {
          player_id: playerId,
          character_id: character.character_id,
          is_purchased: true,
          is_selected: false,
        },
      });

      result.unlockedCharacters.push(character.character_name);
      continue;
    }

    throw new Error(`Unsupported catalog content item: ${content.item_id}`);
  }

  if (Object.keys(playerUpdateData).length > 0) {
    await tx.player.update({
      where: { player_id: playerId },
      data: playerUpdateData,
    });
  }

  return result;
};
