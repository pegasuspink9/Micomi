import { Request, Response } from "express";
import * as LevelService from "./level.service";
import { successResponse, errorResponse } from "../../../utils/response";

/* GET all levels */
export const getAllLevels = async (req: Request, res: Response) => {
  const levels = await LevelService.getAllLevels();
  return successResponse(res, levels, "All levels fetched");
};

/* GET a level by ID */
export const getLevelByID = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const level = await LevelService.getLevelById(id);
  if (!level) return errorResponse(res, null, "Level not found", 404);
  return successResponse(res, level, "Level found");
};

/* POST create level */
export const createLevel = async (req: Request, res: Response) => {
  try {
    const data = await LevelService.createLevel(req.body);
    return successResponse(res, data, "Level created", 201);
  } catch (error) {
    return errorResponse(res, null, "Failed to create level", 400);
  }
};

/* PUT level by ID */
export const updateLevel = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const level = await LevelService.updateLevel(id, req.body);
    return successResponse(res, level, "Level found");
  } catch (error) {
    return errorResponse(res, null, "Faied to update level", 400);
  }
};

/* DELETE a level by ID */
export const deleteLevel = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await LevelService.deleteLevel(id);
    return successResponse(res, null, "Level deleted");
  } catch (error) {
    return errorResponse(res, null, "Failed to delete level", 400);
  }
};
