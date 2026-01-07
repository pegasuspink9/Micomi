import { Request, Response } from "express";
import * as LevelService from "./levels.service";
import * as EnergyService from "../Energy/energy.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const previewLevelController = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id;
    const levelId = Number(req.params.levelId);

    const result = await LevelService.previewLevel(playerId, levelId);
    return successResponse(res, result, "Level preview loaded");
  } catch (error) {
    return errorResponse(
      res,
      "Failed to preview level",
      (error as Error).message,
      400
    );
  }
};

export const enterLevelController = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id;
    const levelId = Number(req.params.levelId);

    // const deductionResult = await EnergyService.deductEnergy(playerId, 5);

    // if (deductionResult.success === false) {
    //    return res.status(400).json({
    //     success: false,
    //     message: deductionResult.message || "Not enough energy!",
    //     error: "Insufficient energy to enter level.",
    //     data: {
    //          restoreInMs: deductionResult.timeToNextRestore
    //     }
    //   });
    // }

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
    return errorResponse(res, error, "Level not unlocked yet.");
  }
};

export const completeLevelDone = async (req: Request, res: Response) => {
  try {
    const playerId = Number(req.params.playerId);
    const levelId = Number(req.params.levelId);

    const result = await LevelService.completeLevelDone(playerId, levelId);

    const levelType = result.level_type;
    let message = "Level completed successfully!";

    if (levelType === "micomiButton") {
      message = "Lesson completed! Great job learning!";
    } else if (levelType === "shopButton") {
      message = "Shopping done! You've stocked up and are ready to continue.";
    }

    return successResponse(res, result, message);
  } catch (error) {
    const err = error as Error;
    return errorResponse(
      res,
      err.message || "Failed to complete level",
      err.message,
      400
    );
  }
};
