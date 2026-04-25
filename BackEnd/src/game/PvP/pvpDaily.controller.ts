import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../utils/response";
import * as PvpDailyService from "./pvpDaily.service";
import { PvpChallengeTopic } from "./pvpDaily.types";
import { getAllRankTiers } from "./pvpRank.service";

const parseMatchId = (value: string | undefined): string => {
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    throw new Error("matchId is required");
  }
  return value.trim();
};

const parseAnswer = (value: unknown): string[] => {
  if (
    !Array.isArray(value) ||
    !value.every((entry) => typeof entry === "string")
  ) {
    throw new Error("answer must be an array of strings");
  }
  return value;
};

const parseInGameMessage = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new Error("message is required");
  }
  return value;
};

const parseChallengeId = (value: string | undefined): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("challengeId must be a valid positive number");
  }
  return parsed;
};

const parseTopic = (value: unknown): PvpChallengeTopic => {
  if (typeof value !== "string") {
    throw new Error("topic is required");
  }

  const normalized = value.trim();
  const allowedTopics: PvpChallengeTopic[] = [
    "HTML",
    "CSS",
    "JavaScript",
    "Computer",
  ];

  if (!allowedTopics.includes(normalized as PvpChallengeTopic)) {
    throw new Error("topic must be one of: HTML, CSS, JavaScript, Computer");
  }

  return normalized as PvpChallengeTopic;
};

export const getDailyPreview = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id as number;
    const result = await PvpDailyService.getDailyPreview(playerId);
    return successResponse(res, result, "Daily PvP preview loaded");
  } catch (error) {
    return errorResponse(
      res,
      error,
      (error as Error).message || "Failed to load PvP preview",
      400,
    );
  }
};

export const playDailyPvp = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id as number;
    const result = await PvpDailyService.enterFindingMatch(playerId);

    const message = result.match_found
      ? "Opponent found. Match is ready"
      : "Searching for opponent";

    return successResponse(res, result, message);
  } catch (error) {
    return errorResponse(
      res,
      error,
      (error as Error).message || "Failed to start matchmaking",
      400,
    );
  }
};

export const setMatchTopic = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id as number;
    const topic = parseTopic(req.body?.topic);
    const result = await PvpDailyService.setMatchTopic(playerId, topic);

    return successResponse(
      res,
      result,
      `PvP topic set to ${topic}. You can now start matchmaking.`,
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      (error as Error).message || "Failed to set PvP topic",
      400,
    );
  }
};

export const getMatchmakingStatus = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id as number;
    const result = await PvpDailyService.getMatchmakingStatus(playerId);

    const message = result.match_found ? "Match found" : "Still finding match";

    return successResponse(res, result, message);
  } catch (error) {
    return errorResponse(
      res,
      error,
      (error as Error).message || "Failed to get matchmaking status",
      400,
    );
  }
};

export const getMatchState = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id as number;
    const matchId = parseMatchId(req.params.matchId);

    const result = await PvpDailyService.getMatchState(playerId, matchId);
    return successResponse(res, result, "Match state loaded");
  } catch (error) {
    const message = (error as Error).message || "Failed to get match state";
    const status = message.includes("not found") ? 404 : 400;

    return errorResponse(res, error, message, status);
  }
};

export const submitAnswer = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id as number;
    const matchId = parseMatchId(req.params.matchId);
    const challengeId = parseChallengeId(req.params.challengeId);
    const answer = parseAnswer(req.body?.answer);

    const result = await PvpDailyService.submitAnswer(
      playerId,
      matchId,
      challengeId,
      answer,
    );

    let message = "Answer submitted";
    if (result.reason === "correct_and_first") {
      message = "Correct answer first. Attack triggered";
    } else if (result.reason === "correct_but_late") {
      message = "Correct, but opponent already resolved this question";
    } else if (result.reason === "incorrect") {
      message = "Incorrect answer. You can try again";
    } else if (result.reason === "round_already_resolved") {
      message = "Round already resolved";
    }

    return successResponse(res, result, message);
  } catch (error) {
    const message = (error as Error).message || "Failed to submit answer";
    const status = message.includes("not found")
      ? 404
      : message.includes("Please wait")
        ? 429
        : 400;
    return errorResponse(res, error, message, status);
  }
};

export const setInGameMessage = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id as number;
    const matchId = parseMatchId(req.params.matchId);
    const message = parseInGameMessage(req.body?.message);

    const result = await PvpDailyService.setInGameMessage(
      playerId,
      matchId,
      message,
    );

    return successResponse(res, result, "In-game message updated");
  } catch (error) {
    const message =
      (error as Error).message || "Failed to update in-game message";
    const status = message.includes("not found") ? 404 : 400;
    return errorResponse(res, error, message, status);
  }
};

export const cancelMatchmaking = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id as number;
    const result = await PvpDailyService.cancelMatchmaking(playerId);
    return successResponse(res, result, "Matchmaking cancelled");
  } catch (error) {
    return errorResponse(
      res,
      error,
      (error as Error).message || "Failed to cancel matchmaking",
      400,
    );
  }
};

export const surrenderMatch = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id as number;
    const matchId = parseMatchId(req.params.matchId);

    const result = await PvpDailyService.surrenderMatch(playerId, matchId);

    return successResponse(res, result, "You have surrendered. Match ended.");
  } catch (error) {
    const message = (error as Error).message || "Failed to surrender match";
    const status = message.includes("not found") ? 404 : 400;

    return errorResponse(res, error, message, status);
  }
};

export const getMatchHistory = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id as number;
    const result = await PvpDailyService.getPlayerMatchHistory(playerId);

    return successResponse(res, result, "Match history loaded successfully");
  } catch (error) {
    return errorResponse(
      res,
      error,
      (error as Error).message || "Failed to load match history",
      400,
    );
  }
};

export const getRankTiers = async (req: Request, res: Response) => {
  try {
    const result = await getAllRankTiers();
    return successResponse(res, result, "Rank tiers retrieved successfully");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch rank tiers", 500);
  }
};
