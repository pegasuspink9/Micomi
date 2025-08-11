import { Response, Request } from "express";
import * as CharacterService from "./character.service";
import { successResponse, errorResponse } from "../../../utils/response";

/* GET all Characters */
export const getAllCharacters = async (req: Request, res: Response) => {
  try {
    const characters = await CharacterService.getAllCharacters();
    return successResponse(res, characters, "All characters fetched");
  } catch (error) {
    return errorResponse(res, null, "Failed to fetch characters", 500);
  }
};

/* GET character by ID */
export const getCharacterById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const character = await CharacterService.getCharacterById(id);
  if (!character) return errorResponse(res, null, "Character not found", 404);
  return successResponse(res, character, "Character found");
};

/* POST a character */
export const createCharacter = async (req: Request, res: Response) => {
  try {
    const character = await CharacterService.createCharacter(req.body);
    return successResponse(res, character, "Character created", 201);
  } catch (error) {
    return errorResponse(res, null, "Failed to create character", 400);
  }
};

/* PUT a character by ID */
export const updateCharacter = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const character = await CharacterService.updateCharacter(id, req.body);
    return successResponse(res, character, "Character updated", 200);
  } catch (error) {
    return errorResponse(res, null, "Failed to update character", 400);
  }
};

/* DELETE a character by ID */
export const deleteCharacter = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await CharacterService.deleteCharacter(id);
    return successResponse(res, null, "Character deleted");
  } catch (error) {
    return errorResponse(res, null, "Failed to delete character", 400);
  }
};
