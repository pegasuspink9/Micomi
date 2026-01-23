import { Request, Response } from "express";
import * as AvatarService from "./avatar.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const getAvailableAvatars = (req: Request, res: Response) => {
  try {
    const avatars = AvatarService.getAllAvatars();
    return successResponse(
      res,
      avatars,
      "Available avatars fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get Avatars Error:", error);
    return errorResponse(res, error, "Failed to fetch avatars", 500);
  }
};

export const selectPlayerAvatar = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id;

    const avatarId = Number(req.params.avatarId);

    if (isNaN(avatarId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Avatar ID. It must be a number.",
      });
    }

    const updatedPlayer = await AvatarService.updatePlayerAvatarById(
      playerId,
      avatarId
    );

    return successResponse(
      res,
      updatedPlayer,
      "Player avatar updated successfully",
      200
    );
  } catch (error: any) {
    console.error("Select Avatar Error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return errorResponse(res, error, "Failed to update avatar", 500);
  }
};
