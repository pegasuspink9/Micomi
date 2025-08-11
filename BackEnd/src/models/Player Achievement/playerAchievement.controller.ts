import { Request, Response } from "express";
import * as PlayerAchievementService from "./playerAchievement.service";
import { successResponse, errorResponse } from "../../../utils/response";

/* GET all player achievements */
export const getAllPlayerAchievement = async (req: Request, res: Response) => {
  const playerAchievements =
    await PlayerAchievementService.getAllPlayerAchievement();
  return successResponse(
    res,
    playerAchievements,
    "All player achievements fetched"
  );
};

/* GET player achievement by ID */
export const getPlayerAchievementById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const playerAchievement =
    await PlayerAchievementService.getPlayerAchievementById(id);
  if (!playerAchievement)
    return errorResponse(res, null, "Player achievement not found", 400);
  return successResponse(
    res,
    playerAchievement,
    "Player achievement found",
    201
  );
};

/* POST a player achievement */
export const createPlayerAchievement = async (req: Request, res: Response) => {
  try {
    const data = await PlayerAchievementService.createPlayerAchievement(
      req.body
    );
    return successResponse(res, data, "Player achievement created", 201);
  } catch (error) {
    return errorResponse(res, null, "Failed to create player achievement", 400);
  }
};

/* PUT a player achievement by ID */
export const updateAchievement = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const player_achievement =
      await PlayerAchievementService.updatePlayerAchievement(id, req.body);
    return successResponse(
      res,
      player_achievement,
      "Player achievement updated"
    );
  } catch (error) {
    return errorResponse(res, null, "Failed to update player achievement", 400);
  }
};

/* DELETE a player achievement by ID */
export const deleteAchievement = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await PlayerAchievementService.deletePlayerAchievement(id);
    return successResponse(res, null, "Player achievement deleted");
  } catch (error) {
    return errorResponse(
      res,
      null,
      "Failed to delete a player achievement",
      400
    );
  }
};
