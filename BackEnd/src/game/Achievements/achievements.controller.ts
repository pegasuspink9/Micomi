import { Request, Response } from "express";
import * as AchievementService from "./achievements.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const getPlayerAchievements = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id;

    const achievements = await AchievementService.checkAchievements(playerId);

    return successResponse(
      res,
      achievements,
      "Achievements checked successfully",
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, null, "Failed to fetch achievements", 500);
  }
};
