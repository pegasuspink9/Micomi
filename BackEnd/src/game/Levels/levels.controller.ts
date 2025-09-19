import { Request, Response } from "express";
import * as LevelService from "./levels.service";
import * as EnergyService from "../Energy/energy.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const enterLevelController = async (req: Request, res: Response) => {
  try {
    const playerId = Number(req.params.playerId);
    const levelId = Number(req.params.levelId);

    const energyStatus = await EnergyService.getPlayerEnergyStatus(playerId);
    if (energyStatus.energy <= 0) {
      return res.status(400).json({
        success: false,
        message: `Not enough energy! Next energy restore in: ${
          energyStatus.timeToNextRestore ?? "N/A"
        }`,
        error: "Challenge submission failed.",
        restoreInMs: energyStatus.restoreInMs,
      });
    }

    const result = await LevelService.enterLevel(playerId, levelId);
    return successResponse(res, result, "Entered level");
  } catch (error) {
    return errorResponse(
      res,
      "Something went wrong.",
      (error as Error).message,
      400
    );
  }
};

export const unlockNextLevel = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id;
    const { mapId, currentLevelNumber } = req.body;

    const result = await LevelService.unlockNextLevel(
      playerId,
      mapId,
      currentLevelNumber
    );
    return successResponse(res, result, "Unlocked new level");
  } catch (error) {
    return errorResponse(res, null, "Level not unlocked yet.");
  }
};
