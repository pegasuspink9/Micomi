import { Request, Response } from "express";
import * as AchievementService from "./achievements.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const checkAchievements = async (req: Request, res: Response) => {
  const { playerId } = req.body;
  try {
    const parsedPlayerId = parseInt(playerId, 10);
    if (isNaN(parsedPlayerId)) {
      return errorResponse(
        res,
        "Invalid player ID",
        "Player ID must be a number",
        400
      );
    }

    await AchievementService.checkAchievements(parsedPlayerId);
    return successResponse(res, null, "Achievements checked successfully", 200);
  } catch (error) {
    return errorResponse(
      res,
      (error as Error).message,
      "Failed to check achievements",
      400
    );
  }
};

export const updateLeaderboard = async (req: Request, res: Response) => {
  try {
    await AchievementService.updateLeaderboard();
    return successResponse(res, null, "Leaderboard updated successfully", 200);
  } catch (error) {
    return errorResponse(
      res,
      (error as Error).message,
      "Failed to update leaderboard",
      500
    );
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const leaderboard = await AchievementService.getLeaderboard();
    return successResponse(
      res,
      leaderboard,
      "Leaderboard fetched successfully",
      200
    );
  } catch (error) {
    return errorResponse(
      res,
      (error as Error).message,
      "Failed to fetch leaderboard",
      404
    );
  }
};

export const getPlayerAchievements = async (req: Request, res: Response) => {
  const { playerId } = req.params;
  try {
    const parsedPlayerId = parseInt(playerId, 10);
    if (isNaN(parsedPlayerId)) {
      return errorResponse(
        res,
        "Invalid player ID",
        "Player ID must be a number",
        400
      );
    }

    const achievements = await AchievementService.getPlayerAchievements(
      parsedPlayerId
    );
    return successResponse(
      res,
      achievements,
      "Player achievements fetched successfully",
      200
    );
  } catch (error) {
    return errorResponse(
      res,
      (error as Error).message,
      "Failed to fetch player achievements",
      404
    );
  }
};
