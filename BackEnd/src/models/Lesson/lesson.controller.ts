import { Request, Response } from "express";
import * as LessonService from "./lesson.service";
import { successResponse, errorResponse } from "../../../utils/response";

/* GET all lessons */
export const getAllLessons = async (req: Request, res: Response) => {
  const lessons = await LessonService.getAllLessons();
  if (!lessons) return errorResponse(res, null, "Lessons not found", 404);
  return successResponse(res, lessons, "Lessons fetched");
};

/* GET a lesson by ID */
export const getLessonById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const lesson = await LessonService.getLessonById(id);
    return successResponse(res, lesson, "Lesson found");
  } catch (error) {
    return errorResponse(res, null, "Lesson not found", 404);
  }
};

/* POST a lesson by ID */
export const createLesson = async (req: Request, res: Response) => {
  try {
    const data = await LessonService.createLesson(req.body);
    return successResponse(res, data, "Lesson created", 201);
  } catch (error) {
    return errorResponse(res, null, "Failed to create lesson", 400);
  }
};

/* PUT a lesson by ID */
export const updateLesson = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const lesson = await LessonService.updateLesson(id, req.body);
    return successResponse(res, lesson, "Lesson updated");
  } catch (error) {
    return errorResponse(res, null, "Failed to update lesson", 400);
  }
};

/* DELETE a lesson by ID */
export const deleteLesson = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await LessonService.deleteLesson(id);
    return successResponse(res, null, "Lesson deleted");
  } catch (error) {
    return errorResponse(res, null, "Feiled to delete lesson", 400);
  }
};
