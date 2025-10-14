import { Request, Response } from "express";
import * as ShopService from "./shop.service";
import { errorResponse, successResponse } from "../../../utils/response";
import { SubmitChallengeControllerResult } from "../Challenges/challenges.types";

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
  const challengeId = Number(req.params.challengeId);
  const { playerPotionId } = req.body;

  if (!playerPotionId || isNaN(Number(playerPotionId))) {
    return errorResponse(res, null, "playerPotionId is required in body", 400);
  }

  const parsedPlayerPotionId = Number(playerPotionId);

  try {
    const result = (await ShopService.usePotion(
      playerId,
      levelId,
      challengeId,
      parsedPlayerPotionId
    )) as SubmitChallengeControllerResult;
    return successResponse(
      res,
      result,
      `${(result as any).potionType ?? "Unknown"} potion used`
    );
  } catch (error) {
    return errorResponse(res, null, (error as Error).message, 400);
  }
};
