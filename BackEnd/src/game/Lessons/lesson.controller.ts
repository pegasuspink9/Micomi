import { Request, Response } from "express";
import {
  getNextLessonService,
  getPreviousLessonService,
} from "./lesson.service";
import { successResponse, errorResponse } from "../../../utils/response";
import {
  MicomiNavigationResponse,
  MicomiNavigationErrorResponse,
} from "./lesson.types";

export const getNextLesson = async (req: Request, res: Response) => {
  const playerId = Number(req.params.playerId);
  const levelId = Number(req.params.levelId);
  const lessonId = Number(req.params.lessonId);

  try {
    const result = await getNextLessonService(playerId, levelId, lessonId);

    // Check if result is an error response
    if ("success" in result && !result.success) {
      return errorResponse(res, null, result.message, 400);
    }

    return successResponse(res, result, "Next lesson loaded successfully");
  } catch (error) {
    return errorResponse(res, error, "Something went wrong", 400);
  }
};

export const getPreviousLesson = async (req: Request, res: Response) => {
  const playerId = Number(req.params.playerId);
  const levelId = Number(req.params.levelId);
  const lessonId = Number(req.params.lessonId);

  try {
    const result = await getPreviousLessonService(playerId, levelId, lessonId);

    // Check if result is an error response
    if ("success" in result && !result.success) {
      return errorResponse(res, null, result.message, 400);
    }

    return successResponse(res, result, "Previous lesson loaded successfully");
  } catch (error) {
    return errorResponse(res, error, "Something went wrong", 400);
  }
};
