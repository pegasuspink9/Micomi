import { Request, Response } from "express";
import * as LeaderboardService from "./leaderboard.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const leaderboard = await LeaderboardService.getLeaderboard(limit);
    return successResponse(res, leaderboard, "Leaderboard fetched", 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, error, "Failed to fetch leaderboard", 500);
  }
};

export const getPlayerRank = async (req: Request, res: Response) => {
  try {
    const playerId = parseInt(req.params.id, 10);
    const entry = await LeaderboardService.getPlayerRank(playerId);
    if (!entry) return res.status(404).json({ error: "Player not found" });
    return successResponse(res, entry, "Player rank fetched", 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, error, "Failed to fetch player rank", 500);
  }
};
