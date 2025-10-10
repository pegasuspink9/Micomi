import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../utils/response";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../utils/token";
import * as PlayerService from "./player.service";

/*GET all players*/
export const getPlayers = async (_req: Request, res: Response) => {
  try {
    const result = await PlayerService.getAllPlayers();
    return successResponse(res, result, "Players fetched successfully");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch players");
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
    return errorResponse(res, error, "Failed to fetch player");
  }
};

/*GET all player profile*/
export const getPlayerProfile = async (req: Request, res: Response) => {
  try {
    const result = await PlayerService.getPlayerProfile(Number(req.params.id));
    if (!result) {
      return errorResponse(res, null, "Player not found", 404);
    }
    return successResponse(res, result, "Player found");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch player");
  }
};

/*POST a player*/
export const createPlayer = async (req: Request, res: Response) => {
  try {
    const data = await PlayerService.createPlayer(req.body);
    return successResponse(res, data, "Player created successfully", 201);
  } catch (error) {
    return errorResponse(res, error, "Failed to create player", 400);
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
    return errorResponse(res, error, "Failed to update player");
  }
};

/*DELETE a player by ID*/
export const deletePlayer = async (req: Request, res: Response) => {
  try {
    const result = await PlayerService.deletePlayer(Number(req.params.id));
    return successResponse(res, result, "Player deleted successfully");
  } catch (error) {
    return errorResponse(res, error, "Failed to delete player");
  }
};

/*LOGIN a player*/
export const loginPlayer = async (req: Request, res: Response) => {
  try {
    const result = await PlayerService.loginPlayer(req.body);

    if (!result) {
      return errorResponse(res, null, "Invalid email or password", 401);
    }

    const accessToken = generateAccessToken({
      id: result.player.id,
      role: "player",
    });
    const refreshToken = generateRefreshToken({
      id: result.player.id,
      role: "player",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(
      res,
      { accessToken, player: result.player },
      "Login successful"
    );
  } catch (error) {
    return errorResponse(res, error, "Failed to login", 500);
  }
};
