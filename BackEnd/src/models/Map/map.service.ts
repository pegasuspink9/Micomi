import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { MapCreateInput, MapUpdateInput } from "./map.types";
import { successResponse, errorResponse } from "../../../utils/response";
import { imagesUrls } from "../../../utils/imageUrls";
import { audioLinks } from "../../../utils/audioLinks";

const prisma = new PrismaClient();

export const getAllMapsByPlayerId = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    if (!playerId) {
      return errorResponse(
        res,
        new Error("Player not authenticated"),
        "Player ID required"
      );
    }
    const playerIdNum = Number(playerId);

    const maps = await prisma.map.findMany({
      orderBy: { map_id: "asc" },
    });

    const enhancedMaps = await Promise.all(
      maps.map(async (map) => {
        const hasProgress = await prisma.playerProgress.findFirst({
          where: {
            player_id: playerIdNum,
            level: {
              map_id: map.map_id,
            },
          },
          select: { progress_id: true },
        });

        const isDefaultUnlocked =
          map.map_name === "HTML" || map.map_name === "Computer";

        return {
          map_id: map.map_id,
          map_name: map.map_name,
          description: map.description,
          is_active: !!hasProgress || isDefaultUnlocked,
          created_at: map.created_at,
          last_updated: map.last_updated,
          map_image: map.map_image,
          player_id: map.player_id,
          difficulty_level: map.difficulty_level,
        };
      })
    );

    const freshQuests = await prisma.playerQuest.findMany({
      where: {
        player_id: playerIdNum,
        current_value: 0,
        is_completed: false,
      },
      select: {
        quest_id: true,
        quest: {
          select: {
            title: true,
            description: true,
            objective_type: true,
            target_value: true,
            reward_exp: true,
            reward_coins: true,
          },
        },
        current_value: true,
        expires_at: true,
      },
      orderBy: {
        quest_id: "asc",
      },
    });

    return successResponse(
      res,
      {
        data: enhancedMaps,
        freshQuests: freshQuests,
        audio: "https://micomi-assets.me/Sounds/Final/Navigation.mp3",
        imagesUrls,
        audioLinks,
      },
      "Maps and fresh quests fetched successfully"
    );
  } catch (error) {
    console.error("Error in getAllMapsByPlayerId:", error);
    return errorResponse(res, error, "Failed to fetch maps and quests");
  }
};

export const getAllMaps = async (req: Request, res: Response) => {
  try {
    const maps = await prisma.map.findMany();

    return successResponse(
      res,
      {
        data: maps,
        audio: "https://micomi-assets.me/Sounds/Final/Navigation.mp3",
      },
      "All maps fetched"
    );
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch maps");
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
