import { Request, Response } from "express";
import * as QuestService from "./quests.service";
import { QuestType } from "@prisma/client";
import { successResponse, errorResponse } from "../../../utils/response";

export const updateQuestProgressController = async (
  req: Request,
  res: Response
) => {
  try {
    const playerId = Number(req.params.playerId);
    const { objective_type, increment } = req.body;

    if (!playerId || !objective_type) {
      return errorResponse(res, null, "Missing required fields", 400);
    }

    if (!Object.values(QuestType).includes(objective_type)) {
      return errorResponse(res, null, "Invalid quest type", 400);
    }

    const result = await QuestService.updateQuestProgress(
      Number(playerId),
      objective_type,
      increment || 1
    );

    return successResponse(res, result, "Quest progress updated");
  } catch (error) {
    return errorResponse(res, null, (error as Error).message);
  }
};

export const claimQuestRewardController = async (
  req: Request,
  res: Response
) => {
  try {
    const playerId = (req as any).user.id;
    const questId = Number(req.params.questId);

    const result = await QuestService.claimQuestReward(playerId, questId);

    if (!result.success) {
      return successResponse(res, { message: result.message }, result.message);
    }

    return successResponse(res, result.data, result.message);
  } catch (error) {
    return errorResponse(res, error, "Failed to claim the quest", 400);
  }
};
