import { prisma } from "../../../prisma/client";
import { io } from "../../index";

export const checkAchievements = async (playerId: number) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
    select: { days_logged_in: true, exp_points: true },
  });
  if (!player) throw new Error("Player not found");

  const [
    achievements,
    existingPlayerAchievements,
    maps,
    completedLevelIds,
    totalCollectibleCharacters,
    ownedCharacters,
    ownedPotions,
  ] = await Promise.all([
    prisma.achievement.findMany(),
    prisma.playerAchievement.findMany({
      where: { player_id: playerId },
      select: {
        player_achievement_id: true,
        achievement_id: true,
        is_owned: true,
      },
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
    prisma.playerCharacter.count({
      where: { player_id: playerId, is_purchased: true },
    }),
    prisma.playerPotion.findMany({ where: { player_id: playerId } }),
  ]);

  const leaderboardRank = player.exp_points
    ? await prisma.player
        .count({
          where: { exp_points: { gt: player.exp_points } },
        })
        .then((count) => count + 1)
    : null;

  console.log(`Player ${playerId} rank: ${leaderboardRank}`);

  const purchasedCharacters = ownedCharacters;
  const potionCount = ownedPotions.reduce(
    (total: number, p: { quantity: number }) => total + p.quantity,
    0
  );

  const bossLevels = await prisma.level.findMany({
    where: { level_difficulty: { in: ["hard", "final"] } },
    include: {
      playerProgress: {
        where: { player_id: playerId, is_completed: true },
        select: { progress_id: true },
      },
    },
  });

  const defeatedBosses = bossLevels.filter(
    (l: { playerProgress: { progress_id: number }[] }) =>
      l.playerProgress.length > 0
  ).length;

  const finalLevels = await prisma.level.findMany({
    where: { level_difficulty: "final" },
    include: {
      map: true,
      playerProgress: {
        where: { player_id: playerId, is_completed: true },
        select: { progress_id: true },
      },
    },
  });

  const hasCompletedMap = (mapName: string): boolean => {
    const finalLevel = finalLevels.find((l) => l.map.map_name === mapName);
    return !!finalLevel && finalLevel.playerProgress.length > 0;
  };

  const hasCompletedAllMaps = (): boolean => {
    return maps.every((m) => {
      const finalLevel = finalLevels.find((l) => l.map.map_id === m.map_id);
      return !!finalLevel && finalLevel.playerProgress.length > 0;
    });
  };

  const newlyUnlockedForEmit: any[] = [];

  for (const achievement of achievements) {
    const existing = existingPlayerAchievements.find(
      (pa) => pa.achievement_id === achievement.achievement_id
    );

    let shouldAward = false;

    switch (achievement.achievement_name) {
      case "HTML Hero":
        shouldAward = hasCompletedMap("HTML");
        break;
      case "CSS Artist":
        shouldAward = hasCompletedMap("CSS");
        break;
      case "Javascript Hunter":
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
      if (existing) {
        if (!existing.is_owned) {
          await prisma.playerAchievement.update({
            where: { player_achievement_id: existing.player_achievement_id },
            data: {
              is_owned: true,
              earned_at: new Date(),
            },
          });

          newlyUnlockedForEmit.push({
            achievement_id: achievement.achievement_id,
            achievement_name: achievement.achievement_name,
            badge_icon: achievement.badge_icon || null,
          });
        }
      } else {
        await prisma.playerAchievement.create({
          data: {
            player_id: playerId,
            achievement_id: achievement.achievement_id,
            earned_at: new Date(),
            is_owned: true,
          },
        });

        newlyUnlockedForEmit.push({
          achievement_id: achievement.achievement_id,
          achievement_name: achievement.achievement_name,
          badge_icon: achievement.badge_icon || null,
        });
      }
    }
  }

  if (newlyUnlockedForEmit.length > 0) {
    io.to(playerId.toString()).emit(
      "achievementUnlocked",
      newlyUnlockedForEmit
    );
  }

  return await prisma.playerAchievement.findMany({
    where: { player_id: playerId },
    include: { achievement: true },
    orderBy: { earned_at: "asc" },
  });
};

export const selectBadge = async (playerId: number, achievementId: number) => {
  const playerBadge = await prisma.playerAchievement.findUnique({
    where: {
      player_id_achievement_id: {
        player_id: playerId,
        achievement_id: achievementId,
      },
    },
  });

  await prisma.playerAchievement.updateMany({
    where: { player_id: playerId },
    data: { is_selected: false },
  });

  await prisma.playerAchievement.update({
    where: { player_achievement_id: playerBadge?.player_achievement_id },
    data: { is_selected: true },
  });

  return { message: "Badge selected" };
};
