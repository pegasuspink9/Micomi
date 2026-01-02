import { prisma } from "../../../prisma/client";
import { Request, Response } from "express";
import { DialogueCreateInput, DialogueUpdateInput } from "./dialogue.types";
import { errorResponse, successResponse } from "../../../utils/response";

export const getAllDialogue = async (req: Request, res: Response) => {
  try {
    const dialogues = await prisma.dialogue.findMany();

    if (!dialogues) {
      return errorResponse(res, null, "Dialogue not found", 404);
    }

    return successResponse(res, dialogues, "Fetched all dialogues");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch dialogues");
  }
};

export const getDialogueById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const dialogue = await prisma.dialogue.findUnique({
      where: { dialogue_id: id },
    });

    if (!dialogue) {
      return errorResponse(res, null, "Dialogue not found", 404);
    }

    return successResponse(res, dialogue, "Failed to fetch dialogue");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch dialogue");
  }
};

export const createDialogue = async (req: Request, res: Response) => {
  try {
    const data: DialogueCreateInput[] = req.body;

    const dialogue = await prisma.dialogue.createMany({
      data,
    });

    return successResponse(res, dialogue, "Dialogue created");
  } catch (error) {
    return errorResponse(res, error, "Failed to create dialogue");
  }
};

export const updateDialogue = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data: DialogueUpdateInput = req.body;
    const dialogue = await prisma.dialogue.update({
      where: { dialogue_id: id },
      data,
    });

    return successResponse(res, dialogue, "Dialogue updated");
  } catch (error) {
    return errorResponse(res, error, "Failed to update dialogue");
  }
};

export const deleteDialogue = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.dialogue.delete({ where: { dialogue_id: id } });

    return successResponse(res, null, "Dialogue deleted");
  } catch (error) {
    return errorResponse(res, error, "Failed to delete dialogue");
  }
};
