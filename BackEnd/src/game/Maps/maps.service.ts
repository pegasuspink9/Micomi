import { PrismaClient } from "@prisma/client";
import { isMapUnlockedForPlayer } from "../Levels/levels.service";

const prisma = new PrismaClient();

const SPECIAL_BUTTON_TYPES = ["micomiButton", "shopButton"] as const;

export const selectMap = async (playerId: number, mapId: number) => {
  const map = await prisma.map.findUnique({
    where: { map_id: mapId },
  });

  if (!map) {
    throw new Error("Map not found");
  }

  const mapUnlocked = await isMapUnlockedForPlayer(playerId, map.map_name);
  if (!mapUnlocked) {
    throw new Error("Map not unlocked yet for this player");
  }

  const fullMap = await prisma.map.findUnique({
    where: { map_id: mapId },
    include: {
      levels: {
        orderBy: { level_number: "asc" },
        include: {
          playerProgress: {
            where: { player_id: playerId },
            select: { progress_id: true, is_completed: true },
          },
        },
      },
    },
  });

  if (!fullMap) {
    throw new Error("Map not available");
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
    audio:
      "https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Sounds/Final/Navigation.mp3",
  };
};
