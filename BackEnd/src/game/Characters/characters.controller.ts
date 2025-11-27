import { Request, Response } from "express";
import * as ShopService from "./characters.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const selectCharacter = async (req: Request, res: Response) => {
  const playerId = Number(req.params.playerId);
  const characterShopId = Number(req.body.characterShopId);

  if (!characterShopId || isNaN(characterShopId)) {
    return errorResponse(res, null, "Valid characterShopId is required", 400);
  }

  if (!playerId || isNaN(playerId)) {
    return errorResponse(res, null, "Valid playerId is required", 400);
  }

  try {
    const result = await ShopService.selectCharacter(playerId, characterShopId);
    return successResponse(res, result, "Character selected");
  } catch (error) {
    return errorResponse(res, null, (error as Error).message, 400);
  }
};
