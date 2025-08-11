import { PrismaClient } from "@prisma/client";
import {
  AchievementCreateInput,
  AchievementUpdateInput,
} from "./achievement.types";

const prisma = new PrismaClient();

export const getAllAchievement = async () => {
  return prisma.achievement.findMany({ include: { playerAchievements: true } });
};

export const getAchievementById = async (id: number) => {
  return prisma.achievement.findUnique({
    where: { achievement_id: id },
    include: { playerAchievements: true },
  });
};

export const createAchievement = async (data: AchievementCreateInput) => {
  return prisma.achievement.create({ data });
};

export const updateAchievement = async (
  id: number,
  data: AchievementUpdateInput
) => {
  return prisma.achievement.update({ where: { achievement_id: id }, data });
};

export const deleteAchievement = async (id: number) => {
  return prisma.achievement.delete({ where: { achievement_id: id } });
};
