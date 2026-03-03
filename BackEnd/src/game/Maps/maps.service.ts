import { PrismaClient } from "@prisma/client";
import { isMapUnlockedForPlayer } from "../Levels/levels.service";

const prisma = new PrismaClient();

const SPECIAL_BUTTON_TYPES = ["micomiButton", "shopButton"] as const;

export const selectMap = async (playerId: number, mapId: number) => {
  let map = await prisma.map.findUnique({
    where: { map_id: mapId },
  });

  if (!map) {
    return { message: "Map not found", success: false };
  }

  const mapUnlocked = await isMapUnlockedForPlayer(playerId, map.map_name);
  if (!mapUnlocked) {
    return { message: "Map not unlocked yet for this player", success: false };
  }

  if (!map.is_active) {
    map = await prisma.map.update({
      where: { map_id: mapId },
      data: { is_active: true, last_updated: new Date() },
    });
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

  const allPlayerProgress = await prisma.playerProgress.findMany({
    where: {
      player_id: playerId,
      level: {
        map_id: mapId,
      },
    },
    include: {
      level: true,
    },
    orderBy: {
      level: {
        level_id: "asc",
      },
    },
  });

  const latestUnlockedProgress =
    allPlayerProgress.length > 0
      ? allPlayerProgress[allPlayerProgress.length - 1]
      : null;

  const allLevelsCompleted = fullMap.levels.every(
    (l) => l.playerProgress.length > 0 && l.playerProgress[0].is_completed,
  );

  const enhancedMap = {
    ...fullMap,
    levels: fullMap.levels.map((level, index) => {
      let isUnlocked = index === 0;

      if (!isUnlocked) {
        isUnlocked = !!level.playerProgress.length;
      }

      let isCurrentUnlocked = false;

      if (playerId === 11 && fullMap.map_name === "HTML") {
        isCurrentUnlocked = level.level_id === 24; //For testing purposes, unlock level 25 for player 11 on HTML map
      } else if (allLevelsCompleted) {
        isCurrentUnlocked = index === fullMap.levels.length - 1;
      } else if (latestUnlockedProgress) {
        isCurrentUnlocked = level.level_id === latestUnlockedProgress.level_id;
      } else {
        isCurrentUnlocked = index === 0;
      }

      return {
        ...level,
        level_number: SPECIAL_BUTTON_TYPES.includes(level.level_type as any)
          ? null
          : level.level_number,
        is_unlocked: isUnlocked,
        isCurrentUnlocked,
      };
    }),
  };

  return {
    map: enhancedMap,
    audio: "https://micomi-assets.me/Sounds/Final/Navigation.mp3",
  };
};
