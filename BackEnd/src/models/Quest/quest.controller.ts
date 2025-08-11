import { Request, Response } from "express";
import * as QuestService from "./quest.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const getAllTemplates = async (_req: Request, res: Response) => {
  try {
    const templates = await QuestService.getAllQuestTemplates();
    return successResponse(res, templates, "Quest templates fetched");
  } catch (error) {
    return errorResponse(res, null, "Quests not found", 404);
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const template = await QuestService.getQuestTemplateById(id);
    return successResponse(res, template, "Quest found");
  } catch (error) {
    return errorResponse(res, null, "Quest not found", 404);
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const quest = await QuestService.createQuestTemplate(req.body);
    return successResponse(res, quest, "Quest created", 201);
  } catch (error) {
    console.error("Create Quest Error:", error);
    return errorResponse(res, null, "Failed to create quest", 400);
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const updated = await QuestService.updateQuestTemplate(id, req.body);
    return successResponse(res, updated, "Quest updated");
  } catch (error) {
    return errorResponse(res, error, "Something went wrong: ", 400);
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    await QuestService.deleteQuestTemplate(id);
    return successResponse(res, null, "Quest deleted");
  } catch (error) {
    return errorResponse(res, error, "Failed to delete quest.", 400);
  }
};
