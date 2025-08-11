import { Request, Response } from "express";
import * as ShopService from "./shop.service";
import { errorResponse, successResponse } from "../../../utils/response";

export const buyItem = async (req: Request, res: Response) => {
  const { playerId, shopId, itemType } = req.body;
  try {
    const result = await ShopService.buyItem(playerId, shopId, itemType);
    return successResponse(res, result, `${itemType} purchased`, 201);
  } catch (error) {
    return errorResponse(res, null, (error as Error).message, 400);
  }
};

export const usePotion = async (req: Request, res: Response) => {
  const { playerId, characterId, potionName } = req.body;
  try {
    const result = await ShopService.usePotion(
      playerId,
      characterId,
      potionName
    );
    return successResponse(res, result, `${potionName} potion used`);
  } catch (error) {
    return errorResponse(res, null, (error as Error).message, 400);
  }
};
