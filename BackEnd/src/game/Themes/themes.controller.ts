import { Request, Response } from "express";
import * as ThemeService from "./themes.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const getThemes = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id;

    const themes = await ThemeService.getAllThemes(playerId);

    return successResponse(
      res,
      themes,
      "Available themes fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get Themes Error:", error);
    return errorResponse(res, error, "Failed to fetch themes", 500);
  }
};

export const buyTheme = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id;
    const themeId = Number(req.params.themeId);

    if (isNaN(themeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Theme ID. It must be a number.",
      });
    }

    const purchasedTheme = await ThemeService.purchaseThemeById(
      playerId,
      themeId,
    );

    return successResponse(
      res,
      purchasedTheme,
      "Theme purchased successfully",
      200,
    );
  } catch (error: any) {
    console.error("Purchase Theme Error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes("Not enough diamonds") ||
      error.message.includes("already own")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return errorResponse(res, error, "Failed to purchase theme", 500);
  }
};

export const selectPlayerTheme = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id;
    const themeId = Number(req.params.themeId);

    if (isNaN(themeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Theme ID. It must be a number.",
      });
    }

    const updatedTheme = await ThemeService.selectPlayerThemeById(
      playerId,
      themeId,
    );

    return successResponse(
      res,
      updatedTheme,
      "Player theme selected successfully",
      200,
    );
  } catch (error: any) {
    console.error("Select Theme Error:", error);

    if (
      error.message.includes("do not own") ||
      error.message.includes("not found")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return errorResponse(res, error, "Failed to select theme", 500);
  }
};
