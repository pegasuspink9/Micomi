import { PrismaClient } from "@prisma/client";
import { InventoryItem } from "../../models/Shop/shop.types";

const prisma = new PrismaClient();

export const getPlayerAchievements = async (playerId: number) => {
  return await prisma.playerAchievement.findMany({
    where: { player_id: playerId },
    include: { achievement: true },
  });
};

export const checkAchievements = async (playerId: number) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
    select: { inventory: true, days_logged_in: true },
  });
  if (!player) throw new Error("Player not found");

  const [
    achievements,
    existingPlayerAchievements,
    maps,
    completedLevelIds,
    totalCharacters,
    bossLevels,
    leaderboard,
  ] = await Promise.all([
    prisma.achievement.findMany(),
    prisma.playerAchievement.findMany({
      where: { player_id: playerId },
      select: { achievement_id: true },
    }),
    prisma.map.findMany({
      include: { levels: { select: { level_id: true } } },
    }),
    prisma.playerProgress
      .findMany({
        where: { player_id: playerId, is_completed: true },
        select: { level_id: true },
      })
      .then((progress) => new Set(progress.map((p) => p.level_id))),
    prisma.character.count(),
    prisma.level.findMany({
      where: { level_type: "final" },
      include: {
        playerProgress: {
          where: { player_id: playerId, is_completed: true },
          select: { progress_id: true },
        },
      },
    }),
    prisma.leaderboard.findFirst({
      where: { player_id: playerId },
      select: { rank: true },
    }),
  ]);

  const inventory: InventoryItem[] =
    (player.inventory as unknown as InventoryItem[]) || [];
  const purchasedCharacters = inventory.filter(
    (item) => item.type === "character" && item.is_purchased
  ).length;
  const potionCount = inventory
    .filter((item) => item.type === "potion" && (item.quantity || 0) > 0)
    .reduce((total, item) => total + (item.quantity || 0), 0);
  const defeatedBosses = bossLevels.filter(
    (level) => level.playerProgress.length > 0
  ).length;

  const hasCompletedMap = (mapName: string): boolean => {
    const map = maps.find((m) => m.map_name === mapName);
    if (!map) return false;
    return map.levels.every((level) => completedLevelIds.has(level.level_id));
  };

  const hasCompletedAllMaps = (): boolean =>
    maps.every((map) =>
      map.levels.every((level) => completedLevelIds.has(level.level_id))
    );

  const earnedAchievementIds = new Set(
    existingPlayerAchievements.map((a) => a.achievement_id)
  );

  const awards = [];
  for (const achievement of achievements) {
    if (earnedAchievementIds.has(achievement.achievement_id)) continue;

    let shouldAward = false;
    switch (achievement.name) {
      case "HTML Hero":
        shouldAward = hasCompletedMap("HTML");
        break;
      case "CSS Conqueror":
        shouldAward = hasCompletedMap("CSS");
        break;
      case "JS Juggernaut":
        shouldAward = hasCompletedMap("JavaScript");
        break;
      case "PC Eater":
        shouldAward = hasCompletedMap("Computer");
        break;
      case "Web Wizard":
        shouldAward = hasCompletedAllMaps();
        break;
      case "Collector":
        shouldAward = purchasedCharacters === totalCharacters;
        break;
      case "Top 1":
        shouldAward = leaderboard?.rank === 1;
        break;
      case "Knowledge Keeper":
        shouldAward = player.days_logged_in >= 7;
        break;
      case "Master Beater":
        shouldAward = defeatedBosses >= 3;
        break;
      case "Wake and Bake":
        shouldAward = potionCount >= 5;
        break;
    }

    if (shouldAward) {
      awards.push({
        player_id: playerId,
        achievement_id: achievement.achievement_id,
        earned_at: new Date(),
      });
    }
  }

  if (awards.length > 0) {
    await prisma.playerAchievement.createMany({ data: awards });
  }
};

export const updateLeaderboard = async () => {
  const players = await prisma.player.findMany({
    select: { player_id: true, total_points: true },
    orderBy: { total_points: "desc" },
  });

  await prisma.$transaction(async (tx) => {
    await tx.leaderboard.deleteMany({});
    const rankedData = players.map((player, index) => ({
      player_id: player.player_id,
      rank: index + 1,
      total_points: player.total_points,
    }));
    if (rankedData.length > 0) {
      await tx.leaderboard.createMany({ data: rankedData });
    }
  });
};

export const getLeaderboard = async () => {
  return await prisma.leaderboard.findMany({
    include: { player: true },
    orderBy: { rank: "asc" },
  });
};
