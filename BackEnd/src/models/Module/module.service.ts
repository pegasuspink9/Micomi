import { prisma } from "../../../prisma/client";
import { Request, Response } from "express";
import { CreateModule, UpdateModule } from "./module.types";
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
