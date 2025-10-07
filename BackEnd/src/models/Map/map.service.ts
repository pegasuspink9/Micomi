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
    return successResponse(res, maps, "All maps fetched");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch maps");
  }
};

export const getMapById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const map = await prisma.map.findUnique({
      where: { map_id: id },
      select: {
        map_id: true,
        levels: {
          orderBy: {
            level_number: "asc",
          },
        },
      },
    });

    if (!map) {
      return errorResponse(res, null, "Map not found", 404);
    }

    return successResponse(res, map, "Map found");
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
