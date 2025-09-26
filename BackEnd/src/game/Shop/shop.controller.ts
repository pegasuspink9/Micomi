import { Request, Response } from "express";
import * as ShopService from "./shop.service";
import { errorResponse, successResponse } from "../../../utils/response";

export const buyPotion = async (req: Request, res: Response) => {
  try {
    const playerId = Number(req.params.playerId);
    const levelId = Number(req.params.levelId);
    const potionId = Number(req.params.potionId);

    const result = await ShopService.buyPotion(playerId, levelId, potionId);
    return successResponse(res, result, `Potion purchased successfully`);
  } catch (error) {
    return errorResponse(res, null, (error as Error).message, 400);
  }
};

export const buyCharacter = async (req: Request, res: Response) => {
  const playerId = Number(req.params.playerId);
  const { characterShopId } = req.body;
  try {
    const result = await ShopService.buyCharacter(playerId, characterShopId);
    return successResponse(res, result, `Character purchased`, 201);
  } catch (error) {
    return errorResponse(res, null, (error as Error).message, 400);
  }
};

export const usePotion = async (req: Request, res: Response) => {
  const playerId = Number(req.params.playerId);
  const levelId = Number(req.params.levelId);
  const potionId = Number(req.params.potionId);

  try {
    const result = await ShopService.usePotion(playerId, levelId, potionId);
    return successResponse(res, result, `${result.potionType} potion used`);
  } catch (error) {
    return errorResponse(res, null, (error as Error).message, 400);
  }
};
