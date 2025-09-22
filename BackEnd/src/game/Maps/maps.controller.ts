import { Request, Response } from "express";
import * as MapService from "./maps.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const selectMap = async (req: Request, res: Response) => {
  try {
    const playerId = Number(req.params.playerId);
    const mapId = Number(req.params.mapId);
    const result = await MapService.selectMap(playerId, mapId);
    return successResponse(res, result, "Seleted map successfully");
  } catch (error) {
    return errorResponse(res, error, "Something went wrong.", 400);
  }
};
