import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../utils/response";
import {
  playerAchievementCreateInput,
  playerAchievementUpdateInput,
} from "./playerAchievement.types";

const prisma = new PrismaClient();

/* GET all player achievements */
export const getAllPlayerAchievement = async (_req: Request, res: Response) => {
  try {
    const playerAchievements = await prisma.playerAchievement.findMany({
      include: { player: true, achievement: true },
    });
    return successResponse(
      res,
      playerAchievements,
      "All player achievements fetched"
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      "Failed to fetch player achievements",
      500
    );
  }
};

/* GET player achievement by ID */
export const getPlayerAchievementById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const playerAchievement = await prisma.playerAchievement.findUnique({
      where: { player_achievement_id: id },
      include: { player: true, achievement: true },
    });

    if (!playerAchievement)
      return errorResponse(res, null, "Player achievement not found", 404);

    return successResponse(res, playerAchievement, "Player achievement found");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch player achievement", 500);
  }
};

/* POST a player achievement */
export const createPlayerAchievement = async (req: Request, res: Response) => {
  try {
    const data: playerAchievementCreateInput = req.body;
    const created = await prisma.playerAchievement.create({ data });
    return successResponse(res, created, "Player achievement created", 201);
  } catch (error) {
    return errorResponse(
      res,
      error,
      "Failed to create player achievement",
      400
    );
  }
};

/* PUT a player achievement by ID */
export const updatePlayerAchievement = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data: playerAchievementUpdateInput = req.body;
    const updated = await prisma.playerAchievement.update({
      where: { player_achievement_id: id },
      data,
    });
    return successResponse(res, updated, "Player achievement updated");
  } catch (error) {
    return errorResponse(
      res,
      error,
      "Failed to update player achievement",
      400
    );
  }
};

/* DELETE a player achievement by ID */
export const deletePlayerAchievement = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.playerAchievement.delete({
      where: { player_achievement_id: id },
    });
    return successResponse(res, null, "Player achievement deleted");
  } catch (error) {
    return errorResponse(
      res,
      error,
      "Failed to delete player achievement",
      400
    );
  }
};
