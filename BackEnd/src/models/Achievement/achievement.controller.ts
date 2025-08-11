import { Request, Response } from "express";
import * as AchievementService from "./achievement.service";
import { errorResponse, successResponse } from "../../../utils/response";

/* GET all achievements */
export const getAllAchievement = async (req: Request, res: Response) => {
  const achievements = await AchievementService.getAllAchievement();
  return successResponse(res, achievements, "Achievements fetched");
};

/* GET achievement by ID */
export const getAchievementById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const achievement = await AchievementService.getAchievementById(id);
    return successResponse(res, achievement, "Achievement found");
  } catch (error) {
    return errorResponse(res, null, "Achievement not found");
  }
};

/* POST an achievement */
export const createAchievement = async (req: Request, res: Response) => {
  try {
    const data = await AchievementService.createAchievement(req.body);
    return successResponse(res, data, "Achievement created", 201);
  } catch (error) {
    return errorResponse(res, null, "Failed to create achievement");
  }
};

/* PUT an achievement by ID */
export const updateAchievement = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const achievement = await AchievementService.updateAchievement(
      id,
      req.body
    );
    return successResponse(res, achievement, "Achievement updated");
  } catch (error) {
    return errorResponse(res, null, "Failed to updtae achievement ");
  }
};

/* DELETE an achievement by ID */
export const deleteAchievement = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await AchievementService.deleteAchievement(id);
    return successResponse(res, null, "Achievement deleted");
  } catch (error) {
    return errorResponse(res, null, "Failed to delete achievement", 400);
  }
};
