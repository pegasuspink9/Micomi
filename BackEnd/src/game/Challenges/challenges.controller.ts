import { Request, Response } from "express";
import * as ChallengeService from "./challenges.service";
import { successResponse, errorResponse } from "../../../utils/response";

export const submitChallenge = async (req: Request, res: Response) => {
  const playerId = (req as any).user.id;
  const { levelId, challengeId, answer } = req.body;
  try {
    const result = await ChallengeService.submitChallenge(
      playerId,
      levelId,
      challengeId,
      answer
    );
    return successResponse(res, result, "Challenge successfully submitted.");
  } catch (error) {
    return errorResponse(
      res,
      "Something went wrong.",
      (error as Error).message,
      400
    );
  }
};
