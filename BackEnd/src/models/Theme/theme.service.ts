import { prisma } from "../../../prisma/client";
import { Request, Response } from "express";
import { CreateTheme, UpdateTheme } from "./theme.types";
import { successResponse, errorResponse } from "../../../utils/response";

export const getAllThemes = async (req: Request, res: Response) => {
  try {
    const themes = await prisma.themeShop.findMany();

    if (!themes) {
      return errorResponse(res, null, "Themes not found", 404);
    }

    return successResponse(res, themes, "Fetched all themes");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch all themes", 404);
  }
};

export const getThemeById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const theme = await prisma.themeShop.findUnique({
      where: { theme_id: id },
    });

    if (!theme) {
      return errorResponse(res, null, "Theme not found", 404);
    }

    return successResponse(res, theme, "Theme found");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch theme", 404);
  }
};

export const createTheme = async (req: Request, res: Response) => {
  try {
    const data: CreateTheme[] = req.body;
    const theme = await prisma.themeShop.createMany({ data });

    return successResponse(res, theme, "Theme created", 201);
  } catch (error) {
    return errorResponse(res, error, "Failed to create theme");
  }
};

export const updateTheme = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data: UpdateTheme = req.body;
  try {
    const theme = await prisma.themeShop.update({
      where: { theme_id: id },
      data,
    });

    return successResponse(res, theme, "Theme updated");
  } catch (error) {
    return errorResponse(res, error, "Failed to update theme");
  }
};

export const deleteTheme = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.themeShop.delete({
      where: { theme_id: id },
    });

    return successResponse(res, null, "Theme deleted");
  } catch (error) {
    return errorResponse(res, error, "Failed to delete theme");
  }
};
