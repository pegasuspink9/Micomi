import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { MapCreateInput, MapUpdateInput } from "./map.types";
import { successResponse, errorResponse } from "../../../utils/response";

const prisma = new PrismaClient();

export const getAllMaps = async (req: Request, res: Response) => {
  try {
    const maps = await prisma.map.findMany({
      include: {
        levels: {
          include: {
            challenges: true,
          },
        },
      },
    });

    return successResponse(
      res,
      {
        data: maps,
        audio: [
          "https://res.cloudinary.com/dpbocuozx/video/upload/v1760353796/Navigation_sxwh2g.mp3",
        ],
      },
      "All maps fetched"
    );
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch maps");
  }
};

export const getAllMapsByPlayerId = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;

    const maps = await prisma.map.findMany({
      where: { player_id: Number(playerId) },
      include: {
        levels: {
          where: { player_id: Number(playerId) },
          include: {
            challenges: true,
          },
        },
      },
    });

    return successResponse(
      res,
      {
        data: maps,
        audio: [
          "https://res.cloudinary.com/dpbocuozx/video/upload/v1760353796/Navigation_sxwh2g.mp3",
        ],
      },
      "All maps for this player fetched"
    );
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch maps for this player");
  }
};

export const getMapById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const map = await prisma.map.findUnique({
      where: { map_id: id },
      include: {
        levels: {
          orderBy: {
            level_number: "asc",
          },
          include: {
            challenges: true,
            playerProgress: true,
            lessons: true,
            potionShopByLevel: true,
            map: true,
          },
        },
      },
    });

    if (!map) {
      return errorResponse(res, null, "Map not found", 404);
    }

    map.levels.sort((a, b) => {
      const aNum = a.level_number ?? Infinity;
      const bNum = b.level_number ?? Infinity;
      return aNum - bNum;
    });

    return successResponse(
      res,
      {
        data: map,
        audio: [
          "https://res.cloudinary.com/dpbocuozx/video/upload/v1760353796/Navigation_sxwh2g.mp3",
        ],
      },
      "Map found"
    );
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch map", 500);
  }
};

export const createMap = async (req: Request, res: Response) => {
  try {
    const data: MapCreateInput[] = req.body;
    const map = await prisma.map.createMany({ data });

    return successResponse(res, map, "Map created", 201);
  } catch (error) {
    return errorResponse(res, error, "Failed to create map", 400);
  }
};

export const updateMap = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data: MapUpdateInput = req.body;
    const map = await prisma.map.update({
      where: { map_id: id },
      data,
    });

    return successResponse(res, map, "Map updated");
  } catch (error) {
    return errorResponse(res, error, "Failed to update map", 400);
  }
};

export const deleteMap = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.map.delete({ where: { map_id: id } });

    return successResponse(res, null, "Map updated");
  } catch (error) {
    errorResponse(res, error, "Failed to delete map", 400);
  }
};
