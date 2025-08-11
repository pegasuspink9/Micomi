import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword } from "../../../utils/hash";
import { generateToken } from "../../../utils/token";
import { PlayerCreateInput, PlayerLoginInput } from "./player.types";
import { isSameDay } from "../../../helper/date";

const prisma = new PrismaClient();

export const getAllPlayers = () =>
  prisma.player.findMany({
    include: {
      playerProgress: true,
      leaderboard: true,
      playerAchievements: true,
    },
  });

export const getPlayerById = (player_id: number) =>
  prisma.player.findUnique({
    where: { player_id },
    include: {
      playerProgress: true,
      leaderboard: true,
      playerAchievements: true,
    },
  });

export const createPlayer = async (data: PlayerCreateInput) => {
  const hashedPassword = await hashPassword(data.password);
  return prisma.player.create({
    data: {
      email: data.email,
      username: data.username,
      password: hashedPassword,
      created_at: data.created_at || new Date(),
      last_active: new Date(),
      days_logged_in: 0,
    },
  });
};

export const updatePlayer = async (
  player_id: number,
  data: Partial<PlayerCreateInput>
) => {
  const { last_active, days_logged_in, password, ...safeData } = data;
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

  const now = new Date();
  const shouldIncrementDays =
    !player.last_active || !isSameDay(now, player.last_active);

  const updatedPlayer = await prisma.player.update({
    where: { player_id: player.player_id },
    data: {
      last_active: now,
      days_logged_in: shouldIncrementDays
        ? player.days_logged_in + 1
        : player.days_logged_in,
    },
  });

  const token = generateToken({ id: player.player_id, role: "player" });
  return {
    token,
    player: {
      id: player.player_id,
      email: player.email,
      days_logged_in: updatedPlayer.days_logged_in,
    },
  };
};
