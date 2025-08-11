import { Request, Response } from "express";
import * as EnemyService from "./enemy.service";
import { successResponse, errorResponse } from "../../../utils/response";

/* GET all enemies */
export const getAllEnemies = async (req: Request, res: Response) => {
  const challenge = await EnemyService.getAllEnemies();
  return successResponse(res, challenge, "All challenges fetched");
};

/* GET enemy by ID */
export const getEnemyById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const enemy = await EnemyService.getEnemyById(id);
  if (!enemy) return errorResponse(res, null, "Enemy not found");
  return successResponse(res, enemy, "Enemy found");
};

/* POST an enemy */
export const createEnemy = async (req: Request, res: Response) => {
  try {
    const data = await EnemyService.createEnemy(req.body);
    return successResponse(res, data, "Enemy created", 201);
  } catch (error) {
    return errorResponse(res, null, "Failed to create enemy", 400);
  }
};

/* PUT an enemy by ID */
export const updateEnemy = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const enemy = await EnemyService.updateEnemy(id, req.body);
    return successResponse(res, enemy, "Enemy updated");
  } catch (error) {
    return errorResponse(res, null, "Failed to update enemy", 400);
  }
};

/* DELETE an enemy by ID */
export const deleteEnemy = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await EnemyService.deleteEnemy(id);
    return successResponse(res, null, "Enemy deleted");
  } catch (error) {
    return errorResponse(res, null, "Failed to delete enemy");
  }
};
