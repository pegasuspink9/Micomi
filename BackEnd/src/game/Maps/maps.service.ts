import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const selectMap = async (playerId: number, mapId: number) => {
  const firstTwoMaps = await prisma.map.findMany({
    orderBy: { map_id: "asc" },
    take: 2,
  });

  for (const m of firstTwoMaps) {
    if (!m.is_active) {
      await prisma.map.update({
        where: { map_id: m.map_id },
        data: { is_active: true },
      });
    }
  }

  const map = await prisma.map.findUnique({
    where: { map_id: mapId },
    include: {
      levels: {
        orderBy: {
          level_number: "asc",
        },
      },
    },
  });

  if (!map || !map.is_active) {
    throw new Error("Map not available");
  }

  const progress = await prisma.playerProgress.findFirst({
    where: { player_id: playerId },
    orderBy: { level_id: "desc" },
  });

  if (
    progress &&
    map.levels.length > 0 &&
    progress.level_id >= map.levels[0].level_id - 1
  ) {
    return { map };
  }

  throw new Error("Map not unlocked yet");
};
