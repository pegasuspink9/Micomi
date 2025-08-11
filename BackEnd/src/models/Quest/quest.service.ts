import { PrismaClient, Quest } from "@prisma/client";
const prisma = new PrismaClient();

export const createQuestTemplate = async (
  data: Omit<
    Quest,
    | "quest_id"
    | "created_at"
    | "completed_at"
    | "current_value"
    | "is_completed"
    | "player_id"
    | "assigned_at"
  >
) => {
  return prisma.quest.create({
    data: {
      ...data,
      is_template: true,
      is_daily: true,
      current_value: 0,
      is_completed: false,
    },
  });
};

export const getAllQuestTemplates = async () => {
  return prisma.quest.findMany({
    where: {
      is_template: true,
    },
  });
};

export const getQuestTemplateById = async (questId: number) => {
  return prisma.quest.findUnique({
    where: { quest_id: questId },
  });
};

export const updateQuestTemplate = async (
  questId: number,
  data: Partial<Quest>
) => {
  return prisma.quest.update({
    where: { quest_id: questId },
    data,
  });
};

export const deleteQuestTemplate = async (questId: number) => {
  return prisma.quest.delete({
    where: { quest_id: questId },
  });
};
