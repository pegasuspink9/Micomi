import { prisma } from "../../../prisma/client";
import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../utils/response";
import {
  LevelPotionShopCreateInput,
  LevelPotionShopUpdateInput,
} from "./levelPotionShop.types";

export const getAllLevelPotionShops = async (req: Request, res: Response) => {
  try {
    const levelPotionShops = await prisma.potionShopByLevel.findMany({
      include: { level: true },
    });
    return successResponse(
      res,
      levelPotionShops,
      "Fetched all level potion shops"
    );
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch level potion shops", 500);
  }
};

export const getLevelPotionShopById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const levelPotionShop = await prisma.potionShopByLevel.findUnique({
      where: { level_id: id },
      include: { level: true },
    });
    return successResponse(res, levelPotionShop, "Level potion shop fetched");
  } catch (error) {
    return errorResponse(res, error, "Level potion shop not found", 404);
  }
};

export const createLevelPotionShop = async (req: Request, res: Response) => {
  try {
    const data: LevelPotionShopCreateInput = req.body;
    const newLevelPotionShop = await prisma.potionShopByLevel.create({ data });
    return successResponse(
      res,
      newLevelPotionShop,
      "Level potion shop created",
      201
    );
  } catch (error) {
    return errorResponse(res, error, "Failed to create level potion shop", 400);
  }
};

export const updateLevelPotionShop = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data: LevelPotionShopUpdateInput = req.body;
    const updatedLevelPotionShop = await prisma.potionShopByLevel.update({
      where: { potion_shop_by_level_id: id },
      data,
    });
    return successResponse(
      res,
      updatedLevelPotionShop,
      "Level potion shop updated"
    );
  } catch (error) {
    return errorResponse(res, error, "Failed to update level potion shop", 400);
  }
};

export const deleteLevelPotionShop = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.potionShopByLevel.delete({
      where: { potion_shop_by_level_id: id },
    });
    return successResponse(res, null, "Level potion shop deleted");
  } catch (error) {
    return errorResponse(res, error, "Failed to delete level potion shop", 400);
  }
};
