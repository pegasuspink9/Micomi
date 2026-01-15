import { PrismaClient, QuestPeriod } from "@prisma/client";
import { hashPassword, comparePassword } from "../../../utils/hash";
import { generateAccessToken } from "../../../utils/token";
import {
  PlayerCreateInput,
  PlayerLoginInput,
  PlayerEditProfileInput,
} from "./player.types";
import { checkAchievements } from "../../game/Achievements/achievements.service";
import { updateQuestProgress } from "../../game/Quests/quests.service";
import { getAllPlayerQuests } from "../Quest/quest.service";
import { QuestType } from "@prisma/client";
import { differenceInCalendarDays } from "date-fns";
import { io } from "../../index";
import { sendPasswordResetEmail } from "../../../utils/email";
import { generateResetToken, verifyResetToken } from "../../../utils/token";

const prisma = new PrismaClient();

const BASE_EXP_REQUIREMENT = 100;
const EXP_EXPONENT = 1.5;

export const calculatePlayerLevel = (expPoints: number): number => {
  for (let level = 1; level <= 1000; level++) {
    let totalExp = 0;
    for (let i = 2; i <= level; i++) {
      totalExp += Math.floor(
        BASE_EXP_REQUIREMENT * Math.pow(i - 1, EXP_EXPONENT)
      );
    }
    if (expPoints < totalExp) {
      return level - 1;
    }
  }
  return 1;
};

export const addExpAndUpdateLevel = async (
  playerId: number,
  expGained: number
) => {
  if (expGained <= 0) return;

  return await prisma.$transaction(async (tx) => {
    const player = await tx.player.findUnique({
      where: { player_id: playerId },
      select: { exp_points: true, level: true },
    });

    if (!player) return { message: "Player not found", success: false };

    const newExp = player.exp_points + expGained;
    const newLevel = calculatePlayerLevel(newExp);

    const updated = await tx.player.update({
      where: { player_id: playerId },
      data: {
        exp_points: newExp,
        level: newLevel,
      },
    });

    if (newLevel > player.level) {
      io.to(playerId.toString()).emit("playerLeveledUp", {
        oldLevel: player.level,
        newLevel,
        totalExp: newExp,
      });
    }

    return updated;
  });
};

export const getLevelProgress = (expPoints: number) => {
  const currentLevel = calculatePlayerLevel(expPoints);

  let currentLevelExp = 0;
  for (let i = 2; i <= currentLevel; i++) {
    currentLevelExp += Math.floor(
      BASE_EXP_REQUIREMENT * Math.pow(i - 1, EXP_EXPONENT)
    );
  }

  let nextLevelExp = 0;
  for (let i = 2; i <= currentLevel + 1; i++) {
    nextLevelExp += Math.floor(
      BASE_EXP_REQUIREMENT * Math.pow(i - 1, EXP_EXPONENT)
    );
  }

  const expInCurrentLevel = expPoints - currentLevelExp;
  const expNeededForNext = nextLevelExp - currentLevelExp;

  return {
    currentLevel,
    expPoints,
    expInCurrentLevel,
    expNeededForNext,
    percentage: Math.round((expInCurrentLevel / expNeededForNext) * 100),
  };
};

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
      level: true,
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

  const questsData = await getAllPlayerQuests(player_id);

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

  const latestAchievement =
    player.playerAchievements
      .filter((pa) => pa.is_owned && pa.earned_at)
      .sort(
        (a, b) =>
          new Date(b.earned_at!).getTime() - new Date(a.earned_at!).getTime()
      )[0] ?? null;

  const latestAchievementFormatted = latestAchievement
    ? {
        achievement_id: latestAchievement.achievement_id,
        achievement_name: latestAchievement.achievement.achievement_name,
        description: latestAchievement.achievement.description,
        landscape_image: latestAchievement.achievement.landscape_image,
        earned_at: latestAchievement.earned_at,
      }
    : null;

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

  const selectedBadge = player.playerAchievements.find(
    (pa) => pa.is_selected && pa.is_owned
  )
    ? (() => {
        const selected = player.playerAchievements.find(
          (pa) => pa.is_selected && pa.is_owned
        )!;
        return {
          achievement_id: selected.achievement_id,
          achievement_name: selected.achievement.achievement_name,
          description: selected.achievement.description,
          landscape_image: selected.achievement.landscape_image,
          earned_at: selected.earned_at,
        };
      })()
    : null;

  const calculatedLevel = calculatePlayerLevel(player.exp_points);

  return {
    player_name: player.player_name,
    username: player.username,
    coins: player.coins,
    current_streak: player.current_streak,
    exp_points: player.exp_points,
    player_level: calculatedLevel,
    ownedCharacters: player.ownedCharacters,
    ownedPotions: player.ownedPotions,

    selectedBadge: selectedBadge,
    latestAchievement: latestAchievementFormatted,

    quests: questsData,

    playerAchievements: mergedAchievements,
    totalActiveMaps: mapsPlayed.size,
    mapsPlayed: Array.from(mapsPlayed.values()),
  };
};

const initializeNewGameState = async (playerId: number) => {
  const firstLevel = await prisma.level.findFirst({
    orderBy: { level_number: "asc" },
  });

  if (firstLevel) {
    await prisma.playerProgress.create({
      data: {
        player_id: playerId,
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

    await prisma.playerAchievement.create({
      data: {
        player_id: playerId,
        achievement_id: 11,
        is_owned: true,
        is_selected: true,
        earned_at: new Date(),
      },
    });
  }
};

export const createPlayer = async (data: PlayerCreateInput) => {
  const finalPassword = data.password
    ? await hashPassword(data.password)
    : null;

  const newPlayer = await prisma.player.create({
    data: {
      player_name: data.player_name,
      email: data.email,
      username: data.username,
      password: finalPassword,
      google_id: (data as any).google_id || null,
      facebook_id: (data as any).facebook_id || null,
      created_at: new Date(),
      last_active: new Date(),
      days_logged_in: 0,
    },
  });

  await initializeNewGameState(newPlayer.player_id);

  console.log(`New player ${newPlayer.player_id} created.`);
  return newPlayer;
};

interface OAuthUserParams {
  provider: "google" | "facebook";
  providerId: string;
  email: string;
  name: string;
}

export const findOrCreateOAuthPlayer = async ({
  provider,
  providerId,
  email,
  name,
}: OAuthUserParams) => {
  let player = await prisma.player.findUnique({
    where:
      provider === "google"
        ? { google_id: providerId }
        : { facebook_id: providerId },
  });

  if (player) return player;

  const existingPlayerByEmail = await prisma.player.findUnique({
    where: { email },
  });

  if (existingPlayerByEmail) {
    player = await prisma.player.update({
      where: { player_id: existingPlayerByEmail.player_id },
      data: {
        [provider === "google" ? "google_id" : "facebook_id"]: providerId,
      },
    });
    console.log(
      `Linked ${provider} account to existing player ${player.player_id}`
    );
    return player;
  }

  const newUsername = `user_${provider}_${providerId.slice(0, 8)}`;

  player = await createPlayer({
    player_name: name,
    email: email,
    username: newUsername,
    password: "",
    ...({
      [provider === "google" ? "google_id" : "facebook_id"]: providerId,
    } as any),
  });

  console.log(`Created new player ${player.player_id} via ${provider}`);
  return player;
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

export const editPlayerProfile = async (
  player_id: number,
  data: PlayerEditProfileInput
) => {
  if (data.email || data.username) {
    const existingUser = await prisma.player.findFirst({
      where: {
        AND: [
          {
            OR: [{ email: data.email }, { username: data.username }],
          },
          {
            NOT: { player_id: player_id },
          },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new Error("Email is already currently in use.");
      }
      if (existingUser.username === data.username) {
        throw new Error("Username is already taken.");
      }
    }
  }

  const updateData: any = {
    ...data,
    last_active: new Date(),
  };

  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  const updatedPlayer = await prisma.player.update({
    where: { player_id },
    data: updateData,
    select: {
      player_id: true,
      player_name: true,
      username: true,
      email: true,
    },
  });

  return updatedPlayer;
};

export const deletePlayer = (player_id: number) =>
  prisma.player.delete({ where: { player_id } });

export const loginPlayer = async ({ email, password }: PlayerLoginInput) => {
  const player = await prisma.player.findUnique({ where: { email } });
  if (!player || !(await comparePassword(password, player.password))) {
    return null;
  }

  const updatedPlayer = await updatePlayerActivity(player.player_id);
  if (updatedPlayer) {
    await updateQuestProgress(player.player_id, QuestType.login_days, 1);
    await checkAchievements(player.player_id);
  }

  return {
    player_id: player.player_id,
    email: player.email,
    player_name: player.player_name,
    days_logged_in: updatedPlayer?.days_logged_in,
    current_streak: updatedPlayer?.current_streak,
    longest_streak: updatedPlayer?.longest_streak,
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

export const requestPasswordReset = async (email: string) => {
  const player = await prisma.player.findUnique({ where: { email } });

  if (!player) return true;

  const resetToken = generateResetToken({
    id: player.player_id,
    email: player.email,
  });

  try {
    await sendPasswordResetEmail(player.email, resetToken);
    console.log(`Reset email sent to ${player.email}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send reset email");
  }

  return true;
};

export const resetPassword = async (token: string, newPassword: string) => {
  let decoded: any;
  try {
    decoded = verifyResetToken(token);
  } catch (error) {
    throw new Error("Invalid or expired reset token");
  }

  const { id, email } = decoded;
  const player = await prisma.player.findUnique({ where: { player_id: id } });

  if (!player || player.email !== email) {
    throw new Error("User not found or email mismatch");
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.player.update({
    where: { player_id: id },
    data: {
      password: hashedPassword,
      last_active: new Date(),
    },
  });

  return { success: true };
};
