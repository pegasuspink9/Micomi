import { prisma } from "../../../prisma/client";
import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../utils/response";

//temorary
export const getAllPlayerProgress = async (req: Request, res: Response) => {
  try {
    const progress = await prisma.playerProgress.findMany();

    if (!progress) {
      return errorResponse(res, null, "Player progress not found", 404);
    }

    return successResponse(res, progress, "Fetched all player progress");
  } catch (error) {
    return errorResponse(res, error, "failed to fetch all player progress");
  }
};
