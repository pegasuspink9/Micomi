import { prisma } from "../../../prisma/client";
import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../utils/response";
import { EnemyCreateInput, EnemyUpdateInput } from "./enemy.types";

export const getAllEnemies = async (req: Request, res: Response) => {
  try {
    const enemies = await prisma.enemy.findMany();

    if (!enemies) {
      return errorResponse(res, null, "Enemy not found", 404);
    }

    return successResponse(res, enemies, "Fetched all enemies");
  } catch (error) {
    return errorResponse(res, error, "failed to fetch all emnemies");
  }
};

export const getEnemyById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const enemy = await prisma.enemy.findUnique({
      where: { enemy_id: id },
    });

    if (!enemy) {
      return errorResponse(res, null, "Enemy not found", 404);
    }

    return successResponse(res, enemy, "Enemy found");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch enemy", 404);
  }
};

export const createEnemy = async (req: Request, res: Response) => {
  try {
    const data: EnemyCreateInput[] = req.body;
    const enemy = await prisma.enemy.createMany({ data });

    return successResponse(res, enemy, "Enemy created", 201);
  } catch (error) {
    return errorResponse(res, error, "Failed to create enemy", 400);
  }
};

export const updateEnemy = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data: EnemyUpdateInput = req.body;
    const enemy = await prisma.enemy.update({
      where: { enemy_id: id },
      data,
    });

    return successResponse(res, enemy, "Enemy updated");
  } catch (error) {
    return errorResponse(res, error, "Failed to update enemy");
  }
};

export const deleteEnemy = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.enemy.delete({ where: { enemy_id: id } });

    return successResponse(res, null, "Enemy deleted");
  } catch (error) {
    return errorResponse(res, error, "Failed to delete enemy");
  }
};
