import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword } from "../../../utils/hash";
import { generateAccessToken } from "../../../utils/token";
import { PlayerCreateInput, PlayerLoginInput } from "./player.types";
import { checkAchievements } from "../../game/Achievements/achievements.service";
import { updateQuestProgress } from "../../game/Quests/quests.service";
import { QuestType } from "@prisma/client";
import { differenceInCalendarDays } from "date-fns";

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
    },
  });

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
