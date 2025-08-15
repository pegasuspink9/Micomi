import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const checkAchievements = async (playerId: number) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
    select: { days_logged_in: true },
  });
  if (!player) throw new Error("Player not found");

  const [
    achievements,
    existingPlayerAchievements,
    maps,
    completedLevelIds,
    totalCollectibleCharacters,
    bossLevels,
    leaderboard,
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
    prisma.character.count({ where: { is_purchased: true } }),
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
    prisma.playerCharacter.count({
      where: { player_id: playerId, is_purchased: true },
    }),
    prisma.playerPotion.findMany({
      where: { player_id: playerId },
    }),
  ]);

  const purchasedCharacters = ownedCharacters;

  const potionCount = ownedPotions.reduce((total, p) => total + p.quantity, 0);

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
        shouldAward =
          totalCollectibleCharacters > 0 &&
          purchasedCharacters === totalCollectibleCharacters;
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
