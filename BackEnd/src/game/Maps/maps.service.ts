import { PrismaClient } from "@prisma/client";
import { isMapUnlockedForPlayer } from "../Levels/levels.service";
import { success } from "zod";

const prisma = new PrismaClient();

const SPECIAL_BUTTON_TYPES = ["micomiButton", "shopButton"] as const;

export const selectMap = async (playerId: number, mapId: number) => {
  const map = await prisma.map.findUnique({
    where: { map_id: mapId },
  });

  if (!map) {
    return { message: "Map not found", success: false };
  }

  const mapUnlocked = await isMapUnlockedForPlayer(playerId, map.map_name);
  if (!mapUnlocked) {
    return { message: "Map not unlocked yet for this player", success: false };
  }

  const fullMap = await prisma.map.findUnique({
    where: { map_id: mapId },
    include: {
      levels: {
        orderBy: { level_number: "asc" },
        include: {
          playerProgress: {
            where: { player_id: playerId },
            select: {
              progress_id: true,
              is_completed: true,
              stars_earned: true,
            },
          },
        },
      },
    },
  });

  if (!fullMap) {
    return { message: "Map not available", success: false };
  }

  const enhancedMap = {
    ...fullMap,
    levels: fullMap.levels.map((level) => ({
      ...level,
      level_number: SPECIAL_BUTTON_TYPES.includes(level.level_type as any)
        ? null
        : level.level_number,
      is_unlocked: !!level.playerProgress.length,
    })),
  };

  return {
    map: enhancedMap,
    audio: "https://micomi-assets.me/Sounds/Final/Navigation.mp3",
  };
};
