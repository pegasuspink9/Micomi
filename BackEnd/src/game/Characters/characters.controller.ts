import { Request, Response } from "express";
import { getSelectedCharacterId } from "./characters.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const getSelectedCharacter = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const parsedPlayerId = parseInt(playerId, 10);

    if (isNaN(parsedPlayerId)) {
      return errorResponse(res, "Error: ", "Invalid player ID", 400);
    }

    const characterId = await getSelectedCharacterId(parsedPlayerId);

    if (characterId === null) {
      return errorResponse(res, "Error: ", "No selected character found", 404);
    }

    return successResponse(
      res,
      { characterId },
      "Selected character retrieved",
      200
    );
  } catch (error) {
    console.error("Error fetching selected character:", error);
    return errorResponse(res, error, "Internal server error", 500);
  }
};
