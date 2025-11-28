import { PrismaClient, QuestPeriod } from "@prisma/client";
import { hashPassword, comparePassword } from "../../../utils/hash";
import { generateAccessToken } from "../../../utils/token";
import { PlayerCreateInput, PlayerLoginInput } from "./player.types";
import { checkAchievements } from "../../game/Achievements/achievements.service";
import { updateQuestProgress } from "../../game/Quests/quests.service";
import { QuestType } from "@prisma/client";
import { differenceInCalendarDays } from "date-fns";
import {
  getPlayerQuestsByPeriod,
  getStartDate,
  getExpirationDate,
} from "../Quest/periodicQuests.service";

const prisma = new PrismaClient();

export const getAllPlayers = () =>
  prisma.player.findMany({
    include: {
      playerProgress: true,
      playerAchievements: true,
    },
  });

export const getPlayerById = (player_id: number) =>
  prisma.player.findUnique({
    where: { player_id },
    include: {
      playerProgress: true,
      playerAchievements: true,
      ownedCharacters: true,
      ownedPotions: true,
      playerQuests: true,
    },
  });

export const getPlayerProfile = async (player_id: number) => {
  const player = await prisma.player.findUnique({
    where: { player_id },
    select: {
      player_name: true,
      username: true,
      coins: true,
      current_streak: true,
      exp_points: true,
      ownedCharacters: {
        where: { is_selected: true },
        include: {
          character: {
            select: { character_name: true, character_image_display: true },
          },
        },
      },
      ownedPotions: { include: { potion: true } },
      playerAchievements: {
        include: { achievement: true },
      },
    },
  });

  if (!player) return null;

  await checkAchievements(player_id);

  const now = new Date();

  const dailyQuests = await prisma.playerQuest.findMany({
    where: {
      player_id,
      quest_period: "daily",
      expires_at: {
        gte: getStartDate("daily"),
        lte: getExpirationDate("daily"),
      },
      is_completed: false,
      is_claimed: false,
    },
    include: { quest: true },
    orderBy: { player_quest_id: "asc" },
  });

  const weeklyQuests = await prisma.playerQuest.findMany({
    where: {
      player_id,
      quest_period: "weekly",
      expires_at: {
        gte: getStartDate("weekly"),
        lte: getExpirationDate("weekly"),
      },
      is_completed: false,
      is_claimed: false,
    },
    include: { quest: true },
    orderBy: { player_quest_id: "asc" },
  });

  const monthlyQuests = await prisma.playerQuest.findMany({
    where: {
      player_id,
      quest_period: "monthly",
      expires_at: {
        gte: getStartDate("monthly"),
        lte: getExpirationDate("monthly"),
      },
      is_completed: false,
      is_claimed: false,
    },
    include: { quest: true },
    orderBy: { player_quest_id: "asc" },
  });

  const completedQuests = await prisma.playerQuest.findMany({
    where: {
      player_id,
      is_completed: true,
      is_claimed: false,
      expires_at: { gte: now },
    },
    include: { quest: true },
    orderBy: { completed_at: "desc" },
  });

  const questLog = await prisma.playerQuest.findMany({
    where: {
      player_id,
      is_claimed: true,
    },
    include: { quest: true },
    orderBy: { completed_at: "desc" },
    take: 50,
  });

  const achievements = await prisma.achievement.findMany();
  const playerAchievementMap = new Map(
    player.playerAchievements.map((pa) => [pa.achievement_id, pa])
  );

  const mergedAchievements = achievements.map((achievement) => {
    const pa = playerAchievementMap.get(achievement.achievement_id);
    return {
      ...achievement,
      is_owned: pa?.is_owned ?? false,
      earned_at: pa?.earned_at ?? null,
    };
  });

  const progress = await prisma.playerProgress.findMany({
    where: { player_id },
    include: {
      level: {
        include: {
          map: {
            select: { map_id: true, map_name: true, is_active: true },
          },
        },
      },
    },
  });

  const mapsPlayed = new Map<number, string>();
  for (const p of progress) {
    const map = p.level.map;
    if (map) mapsPlayed.set(map.map_id, map.map_name);
  }

  if (mapsPlayed.size === 0) {
    const activeMaps = await prisma.map.findMany({
      where: { is_active: true },
      select: { map_id: true, map_name: true },
    });

    for (const m of activeMaps) {
      mapsPlayed.set(m.map_id, m.map_name);
    }
  }

  const formatQuestData = (playerQuests: any[]) => {
    return playerQuests.map((pq) => ({
      player_quest_id: pq.player_quest_id,
      quest_id: pq.quest_id,
      title: pq.quest.title,
      description: pq.quest.description,
      objective_type: pq.quest.objective_type,
      target_value: pq.quest.target_value,
      current_value: pq.current_value,
      reward_exp: pq.quest.reward_exp,
      reward_coins: pq.quest.reward_coins,
      quest_period: pq.quest_period,
      is_completed: pq.is_completed,
      is_claimed: pq.is_claimed,
      completed_at: pq.completed_at,
      expires_at: pq.expires_at,
      progress_percentage: Math.min(
        100,
        Math.round((pq.current_value / pq.quest.target_value) * 100)
      ),
    }));
  };

  return {
    player_name: player.player_name,
    username: player.username,
    coins: player.coins,
    current_streak: player.current_streak,
    exp_points: player.exp_points,
    ownedCharacters: player.ownedCharacters,
    ownedPotions: player.ownedPotions,

    quests: {
      dailyQuests: formatQuestData(dailyQuests),
      weeklyQuests: formatQuestData(weeklyQuests),
      monthlyQuests: formatQuestData(monthlyQuests),
      completedQuests: formatQuestData(completedQuests),
      questLog: formatQuestData(questLog),

      summary: {
        totalActive:
          dailyQuests.length + weeklyQuests.length + monthlyQuests.length,
        totalCompleted: completedQuests.length,
        totalClaimed: questLog.length,
        dailyCount: dailyQuests.length,
        weeklyCount: weeklyQuests.length,
        monthlyCount: monthlyQuests.length,
      },
    },

    playerAchievements: mergedAchievements,
    totalActiveMaps: mapsPlayed.size,
    mapsPlayed: Array.from(mapsPlayed.values()),
  };
};

export const createPlayer = async (data: PlayerCreateInput) => {
  const hashedPassword = await hashPassword(data.password);

  const newPlayer = await prisma.player.create({
    data: {
      player_name: data.player_name,
      email: data.email,
      username: data.username,
      password: hashedPassword,
      created_at: new Date(),
      last_active: new Date(),
      days_logged_in: 0,
    },
  });

  const firstLevel = await prisma.level.findFirst({
    orderBy: { level_number: "asc" },
  });

  if (firstLevel) {
    await prisma.playerProgress.create({
      data: {
        player_id: newPlayer.player_id,
        level_id: firstLevel.level_id,
        current_level: firstLevel.level_number,
        attempts: 0,
        player_answer: {},
        wrong_challenges: [],
        is_completed: false,
        completed_at: null,
        challenge_start_time: new Date(),
      },
    });
  }

  console.log(
    `New player ${newPlayer.player_id} created. Quests will be auto-generated.`
  );

  return newPlayer;
};

export const updatePlayer = async (
  player_id: number,
  data: Partial<PlayerCreateInput>
) => {
  const { password, ...safeData } = data;
  const updateData: any = {
    ...safeData,
    last_active: new Date(),
  };

  if (password) {
    updateData.password = await hashPassword(password);
  }

  return prisma.player.update({
    where: { player_id },
    data: updateData,
  });
};

export const deletePlayer = (player_id: number) =>
  prisma.player.delete({ where: { player_id } });

export const loginPlayer = async ({ email, password }: PlayerLoginInput) => {
  const player = await prisma.player.findUnique({ where: { email } });
  if (!player || !(await comparePassword(password, player.password))) {
    console.log("Login failed: Player not found or password mismatch", {
      email,
      password,
    });
    return null;
  }

  const updatedPlayer = await updatePlayerActivity(player.player_id);

  if (updatedPlayer) {
    await updateQuestProgress(player.player_id, QuestType.login_days, 1);
    await checkAchievements(player.player_id);
  }

  const token = generateAccessToken({ id: player.player_id, role: "player" });

  return {
    token,
    player: {
      id: player.player_id,
      email: player.email,
      days_logged_in: updatedPlayer?.days_logged_in,
      current_streak: updatedPlayer?.current_streak,
      longest_streak: updatedPlayer?.longest_streak,
    },
  };
};

export async function updatePlayerActivity(playerId: number) {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!player) return null;

  const now = new Date();
  const diffDays = player.last_active
    ? differenceInCalendarDays(now, player.last_active)
    : null;

  let { days_logged_in, current_streak, longest_streak } = player;

  if (diffDays === null) {
    days_logged_in = 1;
    current_streak = 1;
    longest_streak = 1;
  } else if (diffDays === 1) {
    days_logged_in += 1;
    current_streak += 1;
    longest_streak = Math.max(longest_streak, current_streak);
  } else if (diffDays > 1) {
    days_logged_in += 1;
    current_streak = 1;
  }

  return prisma.player.update({
    where: { player_id: playerId },
    data: {
      last_active: now,
      days_logged_in,
      current_streak,
      longest_streak,
    },
  });
}
