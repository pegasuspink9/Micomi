import { prisma } from "../../../prisma/client";
import { Request, Response } from "express";
import { CharacterCreateInput, CharacterUpdateInput } from "./character.types";
import { successResponse, errorResponse } from "../../../utils/response";

export const getAllCharacters = async (req: Request, res: Response) => {
  try {
    const characters = await prisma.character.findMany();

    if (!characters) {
      return errorResponse(res, null, "Character not found", 404);
    }

    return successResponse(res, characters, "Fetched all characters");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch all characters", 500);
  }
};

export const getCharacterById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const character = await prisma.character.findUnique({
      where: { character_id: id },
    });

    if (!character) {
      return errorResponse(res, null, "Character not found", 404);
    }

    return successResponse(res, character, "Character found");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch character", 404);
  }
};

export const createCharacter = async (req: Request, res: Response) => {
  try {
    const data: CharacterCreateInput = req.body;
    const character = await prisma.character.create({ data });

    return successResponse(res, character, "Character created", 201);
  } catch (error) {
    return errorResponse(res, error, "Failed to create character", 400);
  }
};

export const updateCharacter = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data: CharacterUpdateInput = req.body;
    const character = await prisma.character.update({
      where: { character_id: id },
      data,
    });

    return successResponse(res, character, "Chracter updated");
  } catch (error) {
    return errorResponse(res, error, "Failed to update character");
  }
};

export const deleteCharacter = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.character.delete({ where: { character_id: id } });

    return successResponse(res, null, "Character deleted");
  } catch (error) {
    return errorResponse(res, error, "Failed to delete character", 400);
  }
};
