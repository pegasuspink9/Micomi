import { Request, Response } from "express";
import { rewardAdEnergy } from "./ads.service";
import { AdMobRewardQuery } from "./ads.types";
import { errorResponse, successResponse } from "../../../utils/response";

export const admobRewardCallback = async (
  req: Request<{}, {}, {}, AdMobRewardQuery>,
  res: Response,
) => {
  try {
    const { custom_data, reward_amount } = req.query;

    const customDataStr = Array.isArray(custom_data)
      ? custom_data[0]
      : custom_data;
    const rewardAmountStr = Array.isArray(reward_amount)
      ? reward_amount[0]
      : reward_amount;

    // 1. Prioritize Token ID (req.user), fallback to AdMob's custom_data
    // Note: Ensure your Auth Middleware is applied to this route if you want to use the token!
    const tokenPlayerId = (req as any).user?.id;
    const customDataPlayerId = customDataStr
      ? parseInt(customDataStr, 10)
      : NaN;

    const playerId = tokenPlayerId || customDataPlayerId;
    const amount = rewardAmountStr ? parseInt(rewardAmountStr, 10) : 25;

    // Validation
    if (!playerId || isNaN(playerId)) {
      return errorResponse(
        res,
        null,
        "Invalid or missing Player ID. Ensure token is provided.",
        400,
      );
    }

    if (amount <= 0) {
      return errorResponse(res, null, "Invalid reward amount", 400);
    }

    const result = await rewardAdEnergy(playerId, amount);

    if (!result.success) {
      return errorResponse(
        res,
        null,
        result.message || "Failed to reward energy",
        400,
      );
    }

    // Return standard JSON response for your frontend
    return successResponse(
      res,
      { energyAdded: result.energyAdded, currentEnergy: result.currentEnergy },
      "Reward successful",
    );
  } catch (error: any) {
    console.error("AdMob Webhook Error:", error);
    return errorResponse(res, error, "Internal Server Error", 500);
  }
};
