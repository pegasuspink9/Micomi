import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../utils/response";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../utils/token";
import { PlayerEditProfileInput } from "./player.types";
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

export const searchPlayersByUsername = async (req: Request, res: Response) => {
  try {
    const username =
      (req.query.username as string) ||
      (req.query.q as string) ||
      (req.body?.username as string) ||
      (req.body?.q as string);

    const page = Number(req.query.page ?? req.body?.page ?? 1);
    const limit = Number(req.query.limit ?? req.body?.limit ?? 20);

    const result = await PlayerService.searchPlayersByUsername(
      username,
      page,
      limit,
    );

    return successResponse(res, result, "Players searched successfully");
  } catch (error: any) {
    return errorResponse(
      res,
      error,
      error.message || "Failed to search players",
      400,
    );
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
    const playerId = (req as any).user.id;
    const result = await PlayerService.getPlayerProfile(playerId);
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
    const playerId = (req as any).user.id;
    const result = await PlayerService.updatePlayer(playerId, req.body);
    return successResponse(res, result, "Player updated successfully");
  } catch (error) {
    return errorResponse(res, error, "Failed to update player");
  }
};

/*Player Update Profile*/
export const updatePlayerProfile = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id;

    const { player_name, username, email, password } = req.body;
    const payload: PlayerEditProfileInput = {
      player_name,
      username,
      email,
      password,
    };

    Object.keys(payload).forEach(
      (key) =>
        (payload as any)[key] === undefined && delete (payload as any)[key],
    );

    const result = await PlayerService.editPlayerProfile(playerId, payload);

    return successResponse(res, result, "Profile updated successfully");
  } catch (error: any) {
    if (error.message.includes("already")) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, error, "Failed to update profile");
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
    const { identifier, email, username, password } = req.body;

    const loginIdentifier = identifier || email || username;

    if (!loginIdentifier || !password) {
      return errorResponse(
        res,
        null,
        "Username/Email and Password are required",
        400,
      );
    }

    const result = await PlayerService.loginPlayer({
      identifier: loginIdentifier,
      password,
    });

    if (!result) {
      return errorResponse(res, null, "Invalid email or password", 401);
    }

    const accessToken = generateAccessToken({
      id: result.player_id,
      role: "player",
    });
    const refreshToken = generateRefreshToken({
      id: result.player_id,
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
      { accessToken, refreshToken, player: result },
      "Login successful",
    );
  } catch (error) {
    return errorResponse(res, error, "Failed to login", 500);
  }
};

/*GET friends recommendations*/
export const getFriendRecommendations = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id;

    const recommendations = await PlayerService.getFriendRecommendations(
      playerId,
      10,
    );

    return successResponse(
      res,
      recommendations,
      "Friend recommendations fetched successfully",
    );
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch friend recommendations");
  }
};
