import { prisma } from "../../../prisma/client";
import { Request, Response } from "express";
import {
  AchievementCreateInput,
  AchievementUpdateInput,
} from "./achievement.types";
import { errorResponse, successResponse } from "../../../utils/response";

export const getAllAchievement = async (req: Request, res: Response) => {
  try {
    const achievements = await prisma.achievement.findMany({
      include: { playerAchievements: true },
    });

    if (!achievements) {
      return errorResponse(res, null, "Achievement not found", 404);
    }

    return successResponse(res, achievements, "Fetched all achievements");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch achievements");
  }
};

export const getAchievementById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const achievement = await prisma.achievement.findUnique({
      where: { achievement_id: id },
      include: { playerAchievements: true },
    });

    if (!achievement) {
      return errorResponse(res, null, "Achievement not found", 404);
    }

    return successResponse(res, achievement, "Failed to fetch achievement");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch achievement");
  }
};

export const createAchievement = async (req: Request, res: Response) => {
  try {
    const { achievement_name, description, badge_icon, conditions } = req.body;

    const achievement = await prisma.achievement.create({
      data: {
        achievement_name,
        description,
        badge_icon,
        conditions,
      },
    });

    return successResponse(res, achievement, "Achievement created");
  } catch (error) {
    return errorResponse(res, error, "Failed to create achievement");
  }
};

export const updateAchievement = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data: AchievementUpdateInput = req.body;
    const achievement = await prisma.achievement.update({
      where: { achievement_id: id },
      data,
    });

    return successResponse(res, achievement, "Achievement updated");
  } catch (error) {
    return errorResponse(res, error, "Failed to update achievement");
  }
};

export const deleteAchievement = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.achievement.delete({ where: { achievement_id: id } });

    return successResponse(res, null, "Achievement deleted");
  } catch (error) {
    return errorResponse(res, error, "Failed to delete achievement");
  }
};
