import { PrismaClient } from "@prisma/client";
import { LessonCreateInput, LessonUpdateInput } from "./lesson.types";

const prisma = new PrismaClient();

export const getAllLessons = async () => {
  return prisma.lesson.findMany({ include: { level: true, map: true } });
};

export const getLessonById = async (id: number) => {
  return prisma.lesson.findUnique({
    where: { lesson_id: id },
    include: { level: true, map: true },
  });
};

export const createLesson = async (data: LessonCreateInput) => {
  return prisma.lesson.create({ data });
};

export const updateLesson = async (id: number, data: LessonUpdateInput) => {
  return prisma.lesson.update({ where: { lesson_id: id }, data });
};

export const deleteLesson = async (id: number) => {
  return prisma.lesson.delete({ where: { lesson_id: id } });
};
