import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../utils/response";
import * as PlayerService from "./player.service";

/*GET all players*/
export const getPlayers = async (_req: Request, res: Response) => {
  try {
    const result = await PlayerService.getAllPlayers();
    return successResponse(res, result, "Players fetched successfully");
  } catch (error) {
    return errorResponse(res, null, "Failed to fetch players");
  }
};

/*GET all player by ID*/
export const getPlayerById = async (req: Request, res: Response) => {
  try {
    const result = await PlayerService.getPlayerById(Number(req.params.id));
    if (!result) {
      return errorResponse(res, null, "Player not found", 404);
    }
    return successResponse(res, result, "Player found");
  } catch (error) {
    return errorResponse(res, null, "Failed to fetch player");
  }
};

/*POST a player*/
export const createPlayer = async (req: Request, res: Response) => {
  try {
    const data = await PlayerService.createPlayer(req.body);
    return successResponse(res, data, "Player created successfully", 201);
  } catch (error) {
    return errorResponse(res, null, "Failed to create player", 400);
  }
};

/*PUT a player by ID*/
export const updatePlayer = async (req: Request, res: Response) => {
  try {
    const result = await PlayerService.updatePlayer(
      Number(req.params.id),
      req.body
    );
    return successResponse(res, result, "Player updated successfully");
  } catch (error) {
    return errorResponse(res, null, "Failed to update player");
  }
};

/*DELETE a player by ID*/
export const deletePlayer = async (req: Request, res: Response) => {
  try {
    const result = await PlayerService.deletePlayer(Number(req.params.id));
    return successResponse(res, result, "Player deleted successfully");
  } catch (error) {
    return errorResponse(res, null, "Failed to delete player");
  }
};

/*LOGIN a player*/
export const loginPlayer = async (req: Request, res: Response) => {
  try {
    const result = await PlayerService.loginPlayer(req.body);
    if (!result) {
      return errorResponse(res, null, "Invalid email or password", 401);
    }
    return successResponse(res, result, "Login successful");
  } catch (error) {
    return errorResponse(res, null, "Failed to login", 500);
  }
};
