import { PrismaClient } from "@prisma/client";
import { MapCreateInput, MapUpdateInput } from "./map.types";

const prisma = new PrismaClient();

export const getAllMaps = async () => {
  return prisma.map.findMany({
    include: {
      levels: {
        include: {
          challenges: true,
          enemies: true,
        },
      },
    },
  });
};

export const getMapById = async (id: number) => {
  return prisma.map.findUnique({
    where: { map_id: id },
    select: {
      map_id: true,
      levels: true,
    },
  });
};

export const createMap = async (data: MapCreateInput) => {
  return prisma.map.create({ data });
};

export const updateMap = async (id: number, data: MapUpdateInput) => {
  return prisma.map.update({
    where: { map_id: id },
    data,
  });
};

export const deleteMap = async (id: number) => {
  return prisma.map.delete({ where: { map_id: id } });
};
