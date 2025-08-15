import { Request, Response } from "express";
import * as MapService from "./maps.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const selectMap = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id;
    const { mapId } = req.body;
    const result = await MapService.selectMap(playerId, mapId);
    return successResponse(res, result, "Seleted map successfully");
  } catch (error) {
    return errorResponse(res, error, "Something went wrong.", 400);
  }
};
