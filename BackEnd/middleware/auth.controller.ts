import { QuestType } from "@prisma/client";
import { Request, Response } from "express";
import { successResponse, errorResponse } from "../utils/response";
import { verifyRefreshToken, generateAccessToken } from "../utils/token";
import { updateQuestProgress } from "../src/game/Quests/quests.service";
import { checkAchievements } from "../src/game/Achievements/achievements.service";
import { updatePlayerActivity } from "../src/models/Player/player.service";

export const refreshAccessToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return errorResponse(res, null, "No refresh token", 401);
  }

  try {
    const decoded = verifyRefreshToken(refreshToken) as any;
    const newAccessToken = generateAccessToken({
      id: decoded.id,
      role: decoded.role,
    });

    const updatedPlayer = await updatePlayerActivity(decoded.id);

    if (updatedPlayer) {
      await updateQuestProgress(decoded.id, QuestType.login_days, 1);

      await checkAchievements(decoded.id);
    }

    return successResponse(
      res,
      { accessToken: newAccessToken },
      "Access token refreshed"
    );
  } catch {
    return errorResponse(res, null, "Invalid refresh token", 403);
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  return successResponse(res, null, "Logged out successfully");
};
