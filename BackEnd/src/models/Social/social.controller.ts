import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../utils/response";
import * as SocialService from "./social.service";

const parseNumericParam = (value: string) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid numeric parameter.");
  }
  return parsed;
};

export const followPlayer = async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user.id;
    const playerId = parseNumericParam(req.params.playerId);

    const request = await SocialService.followPlayer(senderId, playerId);

    return successResponse(res, request, "Player followed successfully", 201);
  } catch (error: any) {
    const status = error.message?.includes("Invalid numeric") ? 400 : 409;
    return errorResponse(
      res,
      error,
      error.message || "Failed to follow player",
      status,
    );
  }
};

export const followBackPlayer = async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).user.id;
    const playerId = parseNumericParam(req.params.playerId);

    const request = await SocialService.followBackPlayer(followerId, playerId);

    return successResponse(res, request, "Follow back completed");
  } catch (error: any) {
    return errorResponse(
      res,
      error,
      error.message || "Failed to follow back",
      404,
    );
  }
};

export const unfollowPlayer = async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).user.id;
    const playerId = parseNumericParam(req.params.playerId);

    const request = await SocialService.unfollowPlayer(followerId, playerId);

    return successResponse(res, request, "Unfollowed successfully");
  } catch (error: any) {
    return errorResponse(
      res,
      error,
      error.message || "Failed to unfollow player",
      404,
    );
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const playerId = req.params.playerId ? parseNumericParam(req.params.playerId) : (req as any).user.id;
    const followers = await SocialService.getFollowers(playerId);

    return successResponse(res, followers, "Followers fetched successfully");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch followers");
  }
};

export const getFollowing = async (req: Request, res: Response) => {
  try {
    const playerId = req.params.playerId ? parseNumericParam(req.params.playerId) : (req as any).user.id;
    const following = await SocialService.getFollowing(playerId);

    return successResponse(res, following, "Following fetched successfully");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch following");
  }
};

export const getPublicPlayerProfile = async (req: Request, res: Response) => {
  try {
    const viewerId = (req as any).user.id;
    const targetPlayerId = parseNumericParam(req.params.playerId);

    const profile = await SocialService.getPublicPlayerProfile(
      viewerId,
      targetPlayerId,
    );

    return successResponse(res, profile, "Public profile fetched successfully");
  } catch (error: any) {
    const status = error.message?.includes("not found") ? 404 : 400;
    return errorResponse(
      res,
      error,
      error.message || "Failed to fetch public profile",
      status,
    );
  }
};
