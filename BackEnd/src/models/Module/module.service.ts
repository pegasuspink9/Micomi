import { prisma } from "../../../prisma/client";
import { Request, Response } from "express";
import {
  CreateModule,
  UpdateModule,
  CreateModuleTitle,
  UpdateModuleTitle,
} from "./module.types";
import { successResponse, errorResponse } from "../../../utils/response";

export const getAllModules = async (req: Request, res: Response) => {
  try {
    const modules = await prisma.module.findMany({
      include: {
        level: true,
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
      include: { level: true },
    });

    return successResponse(res, module, "Module found");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch module", 404);
  }
};

export const createModule = async (req: Request, res: Response) => {
  try {
    const data: CreateModule[] = req.body;
    const module = await prisma.module.createMany({ data });
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

export const createModuleTitle = async (req: Request, res: Response) => {
  try {
    const data: CreateModuleTitle = req.body;
    const moduleTitle = await prisma.moduleTitle.create({ data });
    return successResponse(res, moduleTitle, "Module Title created", 201);
  } catch (error) {
    return errorResponse(res, error, "Failed to create module title");
  }
};

export const updateModuleTitle = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data: UpdateModuleTitle = req.body;
  try {
    const moduleTitle = await prisma.moduleTitle.update({
      where: { module_title_id: id },
      data,
    });
    return successResponse(res, moduleTitle, "Module Title updated");
  } catch (error) {
    return errorResponse(res, error, "Failed to update module title");
  }
};

export const getModuleLanguages = async (req: Request, res: Response) => {
  try {
    const maps = await prisma.map.findMany({
      select: {
        map_id: true,
        map_name: true,
      },
    });
    return successResponse(res, maps, "Fetched module languages");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch languages");
  }
};

export const getModuleTitlesByMap = async (req: Request, res: Response) => {
  const mapId = Number(req.params.mapId);
  try {
    const data = await prisma.level.findMany({
      where: { map_id: mapId },
      select: {
        modules: {
          select: {
            module_id: true,
            moduleTitle: {
              select: {
                module_title_id: true,
                module_title: true,
              },
            },
          },
        },
      },
    });

    const titles = data.flatMap((level) =>
      level.modules
        .filter((m) => m.moduleTitle)
        .map((m) => ({
          module_id: m.module_id,
          module_title_id: m.moduleTitle?.module_title_id,
          module_title: m.moduleTitle?.module_title,
        })),
    );

    return successResponse(res, titles, "Fetched module titles for map");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch titles");
  }
};

export const getModuleContentById = async (req: Request, res: Response) => {
  const moduleId = Number(req.params.moduleId);
  try {
    const content = await prisma.module.findUnique({
      where: { module_id: moduleId },
      select: {
        module_id: true,
        lesson_content: true,
      },
    });

    if (!content) return errorResponse(res, null, "Content not found", 404);
    return successResponse(res, content, "Fetched module content");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch content");
  }
};
