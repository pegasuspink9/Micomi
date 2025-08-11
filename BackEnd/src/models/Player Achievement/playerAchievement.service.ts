import { PrismaClient } from "@prisma/client";
import {
  playerAchievementCreateInput,
  playerAchievementUpdateInput,
} from "./playerAchievement.types";

const prisma = new PrismaClient();

export const getAllPlayerAchievement = async () => {
  return prisma.playerAchievement.findMany({
    include: { player: true, achievement: true },
  });
};

export const getPlayerAchievementById = async (id: number) => {
  return prisma.playerAchievement.findUnique({
    where: { player_achievement_id: id },
    include: { player: true, achievement: true },
  });
};

export const createPlayerAchievement = async (
  data: playerAchievementCreateInput
) => {
  return prisma.playerAchievement.create({ data });
};

export const updatePlayerAchievement = async (
  id: number,
  data: playerAchievementUpdateInput
) => {
  return prisma.playerAchievement.update({
    where: { player_achievement_id: id },
    data,
  });
};

export const deletePlayerAchievement = async (id: number) => {
  return prisma.playerAchievement.delete({
    where: { player_achievement_id: id },
  });
};
