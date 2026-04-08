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

export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user.id;
    const playerId = parseNumericParam(req.params.playerId);

    const request = await SocialService.sendFriendRequest(senderId, playerId);

    return successResponse(
      res,
      request,
      "Friend request sent successfully",
      201,
    );
  } catch (error: any) {
    const status = error.message?.includes("Invalid numeric") ? 400 : 409;
    return errorResponse(
      res,
      error,
      error.message || "Failed to send friend request",
      status,
    );
  }
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
  try {
    const receiverId = (req as any).user.id;
    const requestId = parseNumericParam(req.params.requestId);

    const request = await SocialService.acceptFriendRequest(
      requestId,
      receiverId,
    );

    return successResponse(res, request, "Friend request accepted");
  } catch (error: any) {
    return errorResponse(
      res,
      error,
      error.message || "Failed to accept friend request",
      404,
    );
  }
};

export const declineFriendRequest = async (req: Request, res: Response) => {
  try {
    const receiverId = (req as any).user.id;
    const requestId = parseNumericParam(req.params.requestId);

    const request = await SocialService.declineFriendRequest(
      requestId,
      receiverId,
    );

    return successResponse(res, request, "Friend request declined");
  } catch (error: any) {
    return errorResponse(
      res,
      error,
      error.message || "Failed to decline friend request",
      404,
    );
  }
};

export const getIncomingFriendRequests = async (
  req: Request,
  res: Response,
) => {
  try {
    const playerId = (req as any).user.id;
    const requests = await SocialService.getIncomingFriendRequests(playerId);

    return successResponse(res, requests, "Incoming friend requests fetched");
  } catch (error) {
    return errorResponse(
      res,
      error,
      "Failed to fetch incoming friend requests",
    );
  }
};

export const getFriends = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id;
    const friends = await SocialService.getFriends(playerId);

    return successResponse(res, friends, "Friends fetched successfully");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch friends");
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
