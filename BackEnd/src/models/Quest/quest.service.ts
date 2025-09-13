import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { successResponse, errorResponse } from "../../../utils/response";
import { CreateQuestDto, UpdateQuestDto } from "./quest.types";

const prisma = new PrismaClient();

/* GET all quest templates */
export const getAllTemplates = async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.quest.findMany({
      where: { is_template: true },
    });
    return successResponse(res, templates, "Quest templates fetched");
  } catch (error) {
    return errorResponse(res, null, "Quests not found", 404);
  }
};

/* GET quest template by ID */
export const getTemplateById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const template = await prisma.quest.findUnique({
      where: { quest_id: id },
    });
    if (!template) {
      return errorResponse(res, null, "Quest not found", 404);
    }
    return successResponse(res, template, "Quest found");
  } catch (error) {
    return errorResponse(res, null, "Quest not found", 404);
  }
};

/* CREATE a quest template */
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const data: CreateQuestDto = req.body;

    const quest = await prisma.quest.create({
      data: {
        ...data,
        is_template: true,
        current_value: 0,
        is_completed: false,
      },
    });

    return successResponse(res, quest, "Quest created", 201);
  } catch (error) {
    console.error("Create Quest Error:", error);
    return errorResponse(res, null, "Failed to create quest", 400);
  }
};

/* UPDATE a quest template */
export const updateTemplate = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const data: UpdateQuestDto = req.body;

    const updated = await prisma.quest.update({
      where: { quest_id: id },
      data,
    });

    return successResponse(res, updated, "Quest updated");
  } catch (error) {
    return errorResponse(res, error, "Something went wrong", 400);
  }
};

/* DELETE a quest template */
export const deleteTemplate = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.quest.delete({ where: { quest_id: id } });
    return successResponse(res, null, "Quest deleted");
  } catch (error) {
    return errorResponse(res, error, "Failed to delete quest", 400);
  }
};
