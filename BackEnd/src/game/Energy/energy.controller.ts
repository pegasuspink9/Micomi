import { Request, Response } from "express";
import * as EnergyService from "./energy.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const getEnergyStatusController = async (
  req: Request,
  res: Response,
) => {
  try {
    const playerId = (req as any).user.id;

    const status = await EnergyService.getPlayerEnergyStatus(playerId);
    return successResponse(res, status, "Energy status loaded");
  } catch (error) {
    return errorResponse(
      res,
      "Failed to fetch energy status",
      (error as Error).message,
      400,
    );
  }
};
