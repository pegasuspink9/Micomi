import { Request, Response } from "express";
import * as ShopService from "./characters.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const selectCharacter = async (req: Request, res: Response) => {
  const playerId = (req as any).user.id;
  const { characterId } = req.body;
  try {
    const result = await ShopService.selectCharacter(playerId, characterId);
    return successResponse(res, result, "Character selected");
  } catch (error) {
    return errorResponse(res, null, (error as Error).message, 400);
  }
};
