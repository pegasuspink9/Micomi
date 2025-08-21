import { Request, Response } from "express";
import * as LeaderboardService from "./leaderboard.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const leaderboard = await LeaderboardService.getLeaderboard(10);
    return successResponse(res, leaderboard, "Leaderboard fetched", 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, error, "Failed to fetch leaderboard", 500);
  }
};

export const updateLeaderboard = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id;
    const { points } = req.body;

    await LeaderboardService.updateLeaderboard(playerId, points);
    return successResponse(res, {}, "Leaderboard updated", 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, error, "Failed to update leaderboard", 500);
  }
};
