import { PrismaClient } from "@prisma/client";
import { isMapUnlockedForPlayer } from "../Levels/levels.service";

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

  if (map.map_name === "HTML") {
    const existingProgress = await prisma.playerProgress.findFirst({
      where: {
        player_id: playerId,
        level: {
          map_id: mapId,
        },
      },
    });

    if (!existingProgress) {
      const initialLevels = await prisma.level.findMany({
        where: {
          map_id: mapId,
          level_number: {
            in: [1],
          },
        },
      });

      if (initialLevels.length > 0) {
        await prisma.playerProgress.createMany({
          data: initialLevels.map((level) => ({
            player_id: playerId,
            level_id: level.level_id,
            current_level: level.level_number,
            is_completed: false,
            attempts: 0,
          })),
          skipDuplicates: true,
        });
      }
    }
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
