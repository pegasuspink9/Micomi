import { PrismaClient } from "@prisma/client";
import { MicomiNavigationResponse } from "./lesson.types";

const prisma = new PrismaClient();

export const getNextLessonService = async (
  playerId: number,
  levelId: number,
  lessonId: number
): Promise<MicomiNavigationResponse> => {
  const level = await prisma.level.findUnique({
    where: { level_id: levelId },
    include: {
      lessons: {
        orderBy: { lesson_id: "asc" },
        select: {
          lesson_id: true,
          page_number: true,
          page_url: true,
        },
      },
    },
  });

  if (!level) throw new Error("Level not found");

  const currentIndex = level.lessons.findIndex((l) => l.lesson_id === lessonId);
  if (currentIndex === -1) throw new Error("Current lesson not found");
  if (currentIndex === level.lessons.length - 1) {
    throw new Error("Already at last page");
  }

  const nextIndex = currentIndex + 1;
  const nextLesson = level.lessons[nextIndex];
  const prevLesson = level.lessons[nextIndex - 1];

  const progress = await prisma.playerProgress.findUnique({
    where: {
      player_id_level_id: { player_id: playerId, level_id: levelId },
    },
  });

  const isLastPage = nextIndex === level.lessons.length - 1;
  const isCompleted =
    progress?.done_micomi_level === true || progress?.is_completed === true;

  return {
    level: {
      level_id: level.level_id,
      level_title: level.level_title,
      total_pages: level.lessons.length,
    },
    currentLesson: {
      lesson_id: nextLesson.lesson_id,
      page_number: nextLesson.page_number,
      page_url: nextLesson.page_url,
    },
    previousLesson: {
      lesson_id: prevLesson.lesson_id,
      page_number: prevLesson.page_number,
      page_url: prevLesson.page_url,
    },
    lesson: {
      next_lesson_id:
        nextIndex + 1 < level.lessons.length
          ? level.lessons[nextIndex + 1].lesson_id
          : null,
      previous_lesson_id: prevLesson.lesson_id,
      is_first_page: false,
      is_last_page: isLastPage,
      show_complete_button: isLastPage && !isCompleted,
    },
    progress: {
      is_micomi_completed: isCompleted ?? false,
    },
  };
};

export const getPreviousLessonService = async (
  playerId: number,
  levelId: number,
  lessonId: number
): Promise<MicomiNavigationResponse> => {
  const level = await prisma.level.findUnique({
    where: { level_id: levelId },
    include: {
      lessons: {
        orderBy: { lesson_id: "asc" },
        select: {
          lesson_id: true,
          page_number: true,
          page_url: true,
        },
      },
    },
  });

  if (!level) throw new Error("Level not found");

  const currentIndex = level.lessons.findIndex((l) => l.lesson_id === lessonId);
  if (currentIndex === -1) throw new Error("Current lesson not found");
  if (currentIndex === 0) throw new Error("Already at first page");

  const prevIndex = currentIndex - 1;
  const prevLesson = level.lessons[prevIndex];
  const nextLesson = level.lessons[currentIndex];

  const progress = await prisma.playerProgress.findUnique({
    where: {
      player_id_level_id: { player_id: playerId, level_id: levelId },
    },
  });

  const isLastPage = prevIndex === level.lessons.length - 1;
  const isCompleted =
    progress?.done_micomi_level === true || progress?.is_completed === true;

  return {
    level: {
      level_id: level.level_id,
      level_title: level.level_title,
      total_pages: level.lessons.length,
    },
    currentLesson: {
      lesson_id: prevLesson.lesson_id,
      page_number: prevLesson.page_number,
      page_url: prevLesson.page_url,
    },
    previousLesson:
      prevIndex > 0
        ? {
            lesson_id: level.lessons[prevIndex - 1].lesson_id,
            page_number: level.lessons[prevIndex - 1].page_number,
            page_url: level.lessons[prevIndex - 1].page_url,
          }
        : null,
    lesson: {
      next_lesson_id: nextLesson.lesson_id,
      previous_lesson_id:
        prevIndex > 0 ? level.lessons[prevIndex - 1].lesson_id : null,
      is_first_page: prevIndex === 0,
      is_last_page: isLastPage,
      show_complete_button: isLastPage && !isCompleted,
    },
    progress: {
      is_micomi_completed: isCompleted ?? false,
    },
  };
};
