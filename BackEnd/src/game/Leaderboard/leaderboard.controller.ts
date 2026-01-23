import { Request, Response } from "express";
import * as LeaderboardService from "./leaderboard.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const currentPlayerId = (req as any).user.id;

    const [topPlayers, currentUserRank] = await Promise.all([
      LeaderboardService.getLeaderboard(limit),
      LeaderboardService.getPlayerRank(currentPlayerId),
    ]);

    const result = {
      leaderboard: topPlayers,
      currentUser: currentUserRank
        ? {
            rank: currentUserRank.rank,
            total_points: currentUserRank.total_points,
            username: currentUserRank.username,
            player_avatar: currentUserRank.player_avatar,
          }
        : null,
    };

    return res.status(200).json({
      success: true,
      message: "Leaderboard fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
    });
  }
};

export const getPlayerRank = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id;
    const entry = await LeaderboardService.getPlayerRank(playerId);

    if (!entry) return res.status(404).json({ error: "Player not found" });

    return successResponse(res, entry, "Player rank fetched", 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, error, "Failed to fetch player rank", 500);
  }
};
