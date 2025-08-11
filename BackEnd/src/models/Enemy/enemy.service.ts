import { PrismaClient } from "@prisma/client";
import { EnemyCreateInput, EnemyUpdateInput } from "./enemy.types";

const prisma = new PrismaClient();

export const getAllEnemies = async () => prisma.enemy.findMany();

export const getEnemyById = async (id: number) => {
  return prisma.enemy.findUnique({
    where: { enemy_id: id },
    include: { level: true },
  });
};

export const createEnemy = async (data: EnemyCreateInput) => {
  return await prisma.enemy.create({ data });
};

export const updateEnemy = async (id: number, data: EnemyUpdateInput) => {
  return await prisma.enemy.update({ where: { enemy_id: id }, data });
};

export const deleteEnemy = async (id: number) => {
  return prisma.enemy.delete({ where: { enemy_id: id } });
};
