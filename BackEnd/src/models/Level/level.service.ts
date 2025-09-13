import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../utils/response";
import { LevelCreateInput, LevelUpdateInput } from "./level.types";

const prisma = new PrismaClient();

export const getAllLevels = async (req: Request, res: Response) => {
  try {
    const levels = await prisma.level.findMany({
      include: {
        map: true,
        challenges: true,
        playerProgress: true,
        enemies: true,
      },
    });
    return successResponse(res, levels, "Fetched all levels");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch levels");
  }
};

export const getLevelById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const level = await prisma.level.findUnique({
      where: { level_id: id },
      include: {
        map: true,
        challenges: true,
        playerProgress: true,
        enemies: true,
      },
    });

    if (!level) {
      return errorResponse(res, null, "Level not found", 404);
    }

    return successResponse(res, level, "Level fetch");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch level", 404);
  }
};

export const getLevelChallenges = async (req: Request, res: Response) => {
  const mapId = Number(req.params.id);
  const levelId = Number(req.params.id);
  try {
    const level = await prisma.level.findFirst({
      where: {
        level_id: levelId,
        map_id: mapId,
      },
      select: {
        challenges: true,
      },
    });

    if (!level) {
      return errorResponse(res, null, "Level not found for this map", 404);
    }

    return successResponse(res, level, "Challenges found");
  } catch (error) {
    return errorResponse(res, error, "Error fetching challenges", 500);
  }
};

export const createLevel = async (req: Request, res: Response) => {
  const data: LevelCreateInput = req.body;
  try {
    const level = await prisma.level.create({ data });

    return successResponse(res, level, "Level created", 201);
  } catch (error) {
    return errorResponse(res, error, "Failed to create level", 400);
  }
};

export const updateLevel = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data: LevelUpdateInput = req.body;
    const level = await prisma.level.update({ where: { level_id: id }, data });

    return successResponse(res, level, "Level updated");
  } catch (error) {
    return errorResponse(res, error, "Failed to update level", 400);
  }
};

export const deleteLevel = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.level.delete({ where: { level_id: id } });

    return successResponse(res, null, "Level deleted");
  } catch (error) {
    return errorResponse(res, error, "Failed to delete level", 400);
  }
};
