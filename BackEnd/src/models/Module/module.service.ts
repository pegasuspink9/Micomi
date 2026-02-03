import { prisma } from "../../../prisma/client";
import { Request, Response } from "express";
import {
  CreateModule,
  CreateContent,
  UpdateModule,
  UpdateContent,
} from "./module.types";
import { successResponse, errorResponse } from "../../../utils/response";

export const selectModule = async (req: Request, res: Response) => {
  try {
    const moduleId = Number(req.params.moduleId);
    const playerId = (req as any).user?.id;

    if (!playerId) {
      return errorResponse(res, null, "User ID not found in request", 401);
    }

    const player = await prisma.player.findUnique({
      where: { player_id: playerId },
    });

    if (!player) {
      return errorResponse(res, null, "Player account not found", 404);
    }

    const module = await prisma.module.findUnique({
      where: { module_id: moduleId },
      include: {
        content: true,
      },
    });

    if (!module) {
      return errorResponse(res, null, "Module not found", 404);
    }

    return successResponse(res, module, "Module selected successfully");
  } catch (error) {
    return errorResponse(res, error, "Failed to select module", 500);
  }
};

export const getAllModules = async (req: Request, res: Response) => {
  try {
    const modules = await prisma.module.findMany({
      include: {
        content: true,
      },
    });

    if (!modules) {
      return errorResponse(res, null, "Modules not found", 404);
    }

    return successResponse(res, modules, "Fetched all modules");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch all modules", 404);
  }
};

export const getModuleById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const module = await prisma.module.findUnique({
      where: { module_id: id },
      include: { content: true },
    });

    return successResponse(res, module, "Module found");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch module", 404);
  }
};

export const createModule = async (req: Request, res: Response) => {
  try {
    const data: CreateModule = req.body;
    const module = await prisma.module.create({ data });
    return successResponse(res, module, "Module created", 201);
  } catch (error) {
    return errorResponse(res, error, "Failed to create module");
  }
};

export const updateModule = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data: UpdateModule = req.body;
  try {
    const module = await prisma.module.update({
      where: { module_id: id },
      data,
    });
    return successResponse(res, module, "Module updated");
  } catch (error) {
    return errorResponse(res, error, "Failed to update module");
  }
};

export const createContent = async (req: Request, res: Response) => {
  try {
    const data: CreateContent = req.body;
    const content = await prisma.moduleContent.create({ data });
    return successResponse(res, content, "Content created", 201);
  } catch (error) {
    return errorResponse(res, error, "Failed to create content");
  }
};

export const updateContent = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data: UpdateContent = req.body;
  try {
    const content = await prisma.moduleContent.update({
      where: { module_content_id: id },
      data,
    });
    return successResponse(res, content, "Content updated");
  } catch (error) {
    return errorResponse(res, error, "Failed to update content");
  }
};
