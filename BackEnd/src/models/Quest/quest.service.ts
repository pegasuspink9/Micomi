import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { successResponse, errorResponse } from "../../../utils/response";
import { CreateQuest, UpdateQuest } from "./quest.types";

const prisma = new PrismaClient();

/* GET all quest */
export const getAllQuests = async (_req: Request, res: Response) => {
  try {
    const quests = await prisma.quest.findMany();
    return successResponse(res, quests, "Quest fetched");
  } catch (error) {
    return errorResponse(res, null, "Quests not found", 404);
  }
};

/* GET quest by ID */
export const getQuestById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const quest = await prisma.quest.findUnique({
      where: { quest_id: id },
    });
    if (!quest) {
      return errorResponse(res, null, "Quest not found", 404);
    }
    return successResponse(res, quest, "Quest found");
  } catch (error) {
    return errorResponse(res, error, "Quest not found", 404);
  }
};

/* CREATE a quest */
export const createQuest = async (req: Request, res: Response) => {
  try {
    const data: CreateQuest[] = req.body;

    const quest = await prisma.quest.createMany({ data });

    return successResponse(res, quest, "Quest created", 201);
  } catch (error) {
    return errorResponse(res, error, "Failed to create quest", 400);
  }
};

/* UPDATE a quest */
export const updateQuest = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const data: UpdateQuest = req.body;

    const updated = await prisma.quest.update({
      where: { quest_id: id },
      data,
    });

    return successResponse(res, updated, "Quest updated");
  } catch (error) {
    return errorResponse(res, error, "Something went wrong", 400);
  }
};

/* DELETE a quest */
export const deleteQuest = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.quest.delete({ where: { quest_id: id } });
    return successResponse(res, null, "Quest deleted");
  } catch (error) {
    return errorResponse(res, error, "Failed to delete quest", 400);
  }
};

export const getPlayerQuest = async (req: Request, res: Response) => {
  const playerId = Number(req.params.playerId);
  try {
    const playerQuests = await prisma.player.findMany({
      where: { player_id: playerId },
      include: { playerQuests: true },
    });

    return successResponse(res, playerQuests, "Player quests fetched");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch player quests", 500);
  }
};
