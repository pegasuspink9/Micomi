import { Request, Response } from "express";
import * as ChallengeService from "./challenge.service";
import { successResponse, errorResponse } from "../../../utils/response";

/* GET all challenges */
export const getAllChallenges = async (req: Request, res: Response) => {
  const challenge = await ChallengeService.getAllChallenges();
  return successResponse(res, challenge, "All challenges fetched");
};

/* GET a challenge by ID*/
export const getChallengeById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const challenge = await ChallengeService.getChallengeById(id);
  if (!challenge) return errorResponse(res, null, "Challenge not found", 404);
  return successResponse(res, challenge, "Challenge found");
};

/* POST a challenge */
export const createChallenge = async (req: Request, res: Response) => {
  try {
    const data = await ChallengeService.createChallenge(req.body);
    return successResponse(res, data, "Challenge created", 201);
  } catch (error) {
    return errorResponse(res, null, "Failed to create challenge", 400);
  }
};

/* PUT a challenge by ID */
export const updateChallenge = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const challenge = await ChallengeService.updateChallenge(id, req.body);
    return successResponse(res, challenge, "Challenge updated");
  } catch (err) {
    return errorResponse(res, null, "Failed to update challenge", 400);
  }
};

/* DELETE a challenge by ID */
export const deleteChallenge = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await ChallengeService.deleteChallenge(id);
    return successResponse(res, null, "Challenge deleted");
  } catch (error) {
    return errorResponse(res, null, "Failed to delete challenge", 400);
  }
};

//hi
