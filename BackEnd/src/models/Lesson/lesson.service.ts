import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { LessonCreateInput, LessonUpdateInput } from "./lesson.types";
import { successResponse, errorResponse } from "../../../utils/response";

const prisma = new PrismaClient();

export const getAllLessons = async (req: Request, res: Response) => {
  try {
    const lessons = await prisma.lesson.findMany();

    if (!lessons) {
      return errorResponse(res, null, "Lessons not found", 404);
    }

    return successResponse(res, lessons, "Fetched all lesson");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch lessons", 404);
  }
};

export const getLessonById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { lesson_id: id },
    });

    return successResponse(res, lesson, "Lesson found");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch the lesson", 404);
  }
};

export const createLesson = async (req: Request, res: Response) => {
  try {
    const data: LessonCreateInput = req.body;
    const lesson = await prisma.lesson.create({ data });

    return successResponse(res, lesson, "Lesson created", 201);
  } catch (error) {
    return errorResponse(res, error, "Failed to create lesson", 400);
  }
};

export const updateLesson = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data: LessonUpdateInput = req.body;
    const lesson = await prisma.lesson.update({
      where: { lesson_id: id },
      data,
    });

    return successResponse(res, lesson, "Lesson updated");
  } catch (error) {
    return errorResponse(res, error, "Failed to update lesson", 400);
  }
};

export const deleteLesson = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.lesson.delete({ where: { lesson_id: id } });

    return successResponse(res, null, "Lesson deleted");
  } catch (error) {
    return errorResponse(res, error, "Failed to delete lesson", 400);
  }
};
