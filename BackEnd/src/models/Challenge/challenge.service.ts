import { prisma } from "../../../prisma/client";
import { Request, Response } from "express";
import { ChallengeCreateInput, ChallengeUpdateInput } from "./challenge.types";
import { successResponse, errorResponse } from "../../../utils/response";

export const getAllChallenges = async (req: Request, res: Response) => {
  try {
    const challenges = await prisma.challenge.findMany({
      include: {
        level: true,
      },
    });

    if (!challenges) {
      return errorResponse(res, null, "Challenges not found", 404);
    }

    return successResponse(res, challenges, "Fetched all challenges");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch all challenges", 404);
  }
};

export const getChallengeById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { challenge_id: id },
      include: { level: true },
    });

    return successResponse(res, challenge, "Challenge found");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch challenge", 404);
  }
};

export const createChallenge = async (req: Request, res: Response) => {
  try {
    const data: ChallengeCreateInput = req.body;
    const challenge = await prisma.challenge.create({ data });

    return successResponse(res, challenge, "Challenge created", 201);
  } catch (error) {
    return errorResponse(res, error, "Failed to create challenge");
  }
};

export const updateChallenge = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data: ChallengeUpdateInput = req.body;
    const challenge = await prisma.challenge.update({
      where: { challenge_id: id },
      data,
    });

    return successResponse(res, challenge, "Challenge updated");
  } catch (error) {
    return errorResponse(res, error, "Failed to updated challenge");
  }
};

export const deleteChallenge = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.challenge.delete({ where: { challenge_id: id } });

    return successResponse(res, null, "Challenge deleted");
  } catch (error) {
    return errorResponse(res, error, "Failed to delete challenge");
  }
};
