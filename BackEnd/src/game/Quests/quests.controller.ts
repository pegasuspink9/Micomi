import { Request, Response } from "express";
import * as QuestService from "./quests.service";
import { QuestType } from "@prisma/client";
import { successResponse, errorResponse } from "../../../utils/response";

export const updateQuestProgressController = async (
  req: Request,
  res: Response
) => {
  try {
    const { player_id, objective_type, increment } = req.body;

    if (!player_id || !objective_type) {
      return errorResponse(res, null, "Missing required fields", 400);
    }

    if (!Object.values(QuestType).includes(objective_type)) {
      return errorResponse(res, null, "Invalid quest type", 400);
    }

    const result = await QuestService.updateQuestProgress(
      Number(player_id),
      objective_type,
      increment || 1
    );

    return successResponse(res, result, "Quest progress updated");
  } catch (error) {
    return errorResponse(res, null, (error as Error).message);
  }
};
