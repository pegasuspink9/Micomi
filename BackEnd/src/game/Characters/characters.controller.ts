import { Request, Response } from "express";
import * as ShopService from "./characters.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const selectCharacter = async (req: Request, res: Response) => {
  const playerId = (req as any).user.id;
  const characterId = Number(req.params.characterId);

  if (!playerId || isNaN(playerId)) {
    return errorResponse(res, null, "Valid playerId is required", 400);
  }

  if (!characterId || isNaN(characterId)) {
    return errorResponse(res, null, "Valid characterId is required", 400);
  }

  try {
    const result = await ShopService.selectCharacter(playerId, characterId);
    return successResponse(res, result, "Character selected");
  } catch (error) {
    return errorResponse(res, null, (error as Error).message, 400);
  }
};
