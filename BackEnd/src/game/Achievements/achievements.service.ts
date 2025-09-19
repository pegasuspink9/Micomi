import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const checkAchievements = async (playerId: number) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
    select: { days_logged_in: true, total_points: true },
  });
  if (!player) throw new Error("Player not found");

  const [
    achievements,
    existingPlayerAchievements,
    maps,
    completedLevelIds,
    totalCollectibleCharacters,
    bossLevels,
    ownedCharacters,
    ownedPotions,
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
    prisma.playerCharacter.count({
      where: { player_id: playerId, is_purchased: true },
    }),
    prisma.playerPotion.findMany({ where: { player_id: playerId } }),
  ]);

  // ✅ Calculate rank dynamically
  const leaderboardRank = player.total_points
    ? await prisma.player
        .count({
          where: { total_points: { gt: player.total_points } },
        })
        .then((count) => count + 1)
    : null;

  const purchasedCharacters = ownedCharacters;
  const potionCount = ownedPotions.reduce(
    (total: number, p: { quantity: number }) => total + p.quantity,
    0
  );
  const defeatedBosses = bossLevels.filter(
    (l: { playerProgress: { progress_id: number }[] }) =>
      l.playerProgress.length > 0
  ).length;

  const hasCompletedMap = (mapName: string): boolean => {
    const map = maps.find(
      (m: { map_name: string; levels: { level_id: number }[] }) =>
        m.map_name === mapName
    );
    if (!map) return false;
    return map.levels.every((level: { level_id: number }) =>
      completedLevelIds.has(level.level_id)
    );
  };

  const hasCompletedAllMaps = (): boolean =>
    maps.every((map: { levels: { level_id: number }[] }) =>
      map.levels.every((level: { level_id: number }) =>
        completedLevelIds.has(level.level_id)
      )
    );

  const earnedAchievementIds = new Set(
    existingPlayerAchievements.map(
      (a: { achievement_id: number }) => a.achievement_id
    )
  );

  const awards: {
    player_id: number;
    achievement_id: number;
    earned_at: Date;
  }[] = [];

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
        shouldAward =
          totalCollectibleCharacters > 0 &&
          purchasedCharacters >= totalCollectibleCharacters;
        break;
      case "Top 1":
        shouldAward = leaderboardRank === 1;
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
    await prisma.playerAchievement.createMany({
      data: awards,
      skipDuplicates: true,
    });
  }

  return prisma.playerAchievement.findMany({
    where: { player_id: playerId },
    include: { achievement: true },
  });
};
