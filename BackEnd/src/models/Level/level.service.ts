import { PrismaClient } from "@prisma/client";
import { LevelCreateInput, LevelUpdateInput } from "./level.types";

const prisma = new PrismaClient();

export const getAllLevels = () =>
  prisma.level.findMany({
    include: {
      map: true,
      challenges: true,
      playerProgress: true,
      enemies: true,
    },
  });

export const getLevelById = (id: number) =>
  prisma.level.findUnique({
    where: { level_id: id },
    include: {
      map: true,
      challenges: true,
      playerProgress: true,
      enemies: true,
    },
  });

export const getLevelChallenges = async (mapId: number, levelId: number) => {
  return prisma.level.findFirst({
    where: {
      level_id: levelId,
      map_id: mapId,
    },
    select: {
      challenges: true,
    },
  });
};

export const createLevel = async (data: LevelCreateInput) => {
  return prisma.level.create({ data });
};

export const updateLevel = async (id: number, data: LevelUpdateInput) => {
  return prisma.level.update({ where: { level_id: id }, data });
};

export const deleteLevel = async (id: number) => {
  return prisma.level.delete({ where: { level_id: id } });
};
