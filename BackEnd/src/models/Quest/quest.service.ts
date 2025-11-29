import { Request, Response } from "express";
import { PrismaClient, QuestPeriod } from "@prisma/client";
import { successResponse, errorResponse } from "../../../utils/response";
import { CreateQuest, UpdateQuest } from "./quest.types";
import {
  generatePeriodicQuests,
  cleanupExpiredQuests,
  getPlayerQuestsByPeriod,
  forceGenerateQuestsForPlayer,
} from "./periodicQuests.service";

const prisma = new PrismaClient();

/* GET all quest */
export const getAllQuests = async (_req: Request, res: Response) => {
  try {
    const quests = await prisma.quest.findMany();
    return successResponse(res, quests, "Quest fetched");
  } catch (error) {
    return errorResponse(res, null, "Quests not found", 404);
  }
};

/* GET quest by ID */
export const getQuestById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const quest = await prisma.quest.findUnique({
      where: { quest_id: id },
    });
    if (!quest) {
      return errorResponse(res, null, "Quest not found", 404);
    }
    return successResponse(res, quest, "Quest found");
  } catch (error) {
    return errorResponse(res, error, "Quest not found", 404);
  }
};

/* CREATE a quest */
export const createQuest = async (req: Request, res: Response) => {
  try {
    const data: CreateQuest[] = req.body;
    const quest = await prisma.quest.createMany({ data });
    return successResponse(res, quest, "Quest created", 201);
  } catch (error) {
    return errorResponse(res, error, "Failed to create quest", 400);
  }
};

/* UPDATE a quest */
export const updateQuest = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const data: UpdateQuest = req.body;
    const updated = await prisma.quest.update({
      where: { quest_id: id },
      data,
    });
    return successResponse(res, updated, "Quest updated");
  } catch (error) {
    return errorResponse(res, error, "Something went wrong", 400);
  }
};

/* DELETE a quest */
export const deleteQuest = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.quest.delete({ where: { quest_id: id } });
    return successResponse(res, null, "Quest deleted");
  } catch (error) {
    return errorResponse(res, error, "Failed to delete quest", 400);
  }
};

/* GET player quests */
export const getPlayerQuest = async (req: Request, res: Response) => {
  const playerId = Number(req.params.playerId);
  try {
    const playerQuests = await prisma.playerQuest.findMany({
      where: { player_id: playerId },
      include: { quest: true },
      orderBy: { expires_at: "desc" },
    });
    return successResponse(res, playerQuests, "Player quests fetched");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch player quests", 500);
  }
};

/* GET player quests by period (NEW - UNIFIED ENDPOINT) */
export const getPlayerQuestsByPeriodController = async (
  req: Request,
  res: Response
) => {
  const playerId = Number(req.params.playerId);
  const period = req.query.period as QuestPeriod;

  if (!period || !["daily", "weekly", "monthly"].includes(period)) {
    return errorResponse(
      res,
      null,
      "Invalid period. Must be daily, weekly, or monthly",
      400
    );
  }

  try {
    const quests = await getPlayerQuestsByPeriod(playerId, period);

    // Fallback: If no quests, generate them
    if (quests.length === 0) {
      console.log(
        `Player ${playerId} has no ${period} quests. Generating now...`
      );
      const newQuests = await forceGenerateQuestsForPlayer(playerId, period);
      return successResponse(
        res,
        newQuests,
        `${period} quests generated (missed cron)`
      );
    }

    return successResponse(res, quests, `${period} quests fetched`);
  } catch (error) {
    console.error(`Error fetching ${period} quests:`, error);
    return errorResponse(res, error, `Failed to fetch ${period} quests`, 500);
  }
};

/* DEPRECATED: Use getPlayerQuestsByPeriodController with ?period=daily instead */
export const getPlayerDailyQuestsController = async (
  req: Request,
  res: Response
) => {
  const playerId = Number(req.params.playerId);
  try {
    const quests = await getPlayerQuestsByPeriod(playerId, "daily");

    if (quests.length === 0) {
      console.log(`Player ${playerId} has no daily quests. Generating now...`);
      const newQuests = await forceGenerateQuestsForPlayer(playerId, "daily");
      return successResponse(
        res,
        newQuests,
        "Daily quests generated (missed cron)"
      );
    }

    return successResponse(res, quests, "Daily quests fetched");
  } catch (error) {
    console.error("Error fetching daily quests:", error);
    return errorResponse(res, error, "Failed to fetch daily quests", 500);
  }
};

/* ADMIN: Generate periodic quests (NEW - UNIFIED) */
export const adminGeneratePeriodicQuests = async (
  req: Request,
  res: Response
) => {
  const period = req.body.period as QuestPeriod;

  if (!period || !["daily", "weekly", "monthly"].includes(period)) {
    return errorResponse(
      res,
      null,
      "Invalid period. Must be daily, weekly, or monthly",
      400
    );
  }

  try {
    console.log(`🔧 Admin triggered ${period} quest generation`);
    const result = await generatePeriodicQuests(period);
    return successResponse(
      res,
      result,
      `${period} quests generated for all players`
    );
  } catch (error) {
    console.error(`Admin ${period} generation error:`, error);
    return errorResponse(
      res,
      error,
      `Failed to generate ${period} quests`,
      500
    );
  }
};

/* DEPRECATED: Use adminGeneratePeriodicQuests with body: {period: "daily"} */
export const adminGenerateDailyQuests = async (
  _req: Request,
  res: Response
) => {
  try {
    console.log("🔧 Admin triggered daily quest generation");
    const result = await generatePeriodicQuests("daily");
    return successResponse(
      res,
      result,
      "Daily quests generated for all players"
    );
  } catch (error) {
    console.error("Admin generation error:", error);
    return errorResponse(res, error, "Failed to generate daily quests", 500);
  }
};

/* ADMIN: Cleanup expired quests */
export const adminCleanupExpiredQuests = async (
  _req: Request,
  res: Response
) => {
  try {
    const result = await cleanupExpiredQuests();
    return successResponse(
      res,
      result,
      "Cleaned up expired quests successfully"
    );
  } catch (error) {
    return errorResponse(res, error, "Failed to cleanup quests", 500);
  }
};

/* ADMIN: Force refresh for specific player */
export const adminForceRefreshPlayerQuests = async (
  req: Request,
  res: Response
) => {
  const playerId = Number(req.params.playerId);
  const period = (req.body.period as QuestPeriod) || "daily";

  if (!["daily", "weekly", "monthly"].includes(period)) {
    return errorResponse(
      res,
      null,
      "Invalid period. Must be daily, weekly, or monthly",
      400
    );
  }

  try {
    const newQuests = await forceGenerateQuestsForPlayer(playerId, period);
    return successResponse(
      res,
      newQuests,
      `${period} quests refreshed for player ${playerId}`
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      `Failed to refresh player ${period} quests`,
      500
    );
  }
};

/* ADMIN: Get statistics */
export const adminGetQuestStats = async (req: Request, res: Response) => {
  const period = (req.query.period as QuestPeriod) || "daily";

  if (!["daily", "weekly", "monthly"].includes(period)) {
    return errorResponse(
      res,
      null,
      "Invalid period. Must be daily, weekly, or monthly",
      400
    );
  }

  try {
    const now = new Date();
    let startDate = new Date(now);

    // Calculate start date based on period
    if (period === "daily") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "weekly") {
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(now.getDate() - daysToMonday);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "monthly") {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    const [totalPlayers, playersWithQuests, totalQuests, completedQuests] =
      await Promise.all([
        prisma.player.count(),
        prisma.playerQuest.groupBy({
          by: ["player_id"],
          where: {
            quest_period: period,
            expires_at: { gte: startDate },
          },
        }),
        prisma.playerQuest.count({
          where: {
            quest_period: period,
            expires_at: { gte: startDate },
          },
        }),
        prisma.playerQuest.count({
          where: {
            quest_period: period,
            expires_at: { gte: startDate },
            is_completed: true,
          },
        }),
      ]);

    const stats = {
      period,
      totalPlayers,
      playersWithQuests: playersWithQuests.length,
      playersMissingQuests: totalPlayers - playersWithQuests.length,
      totalQuests,
      completedQuests,
      completionRate:
        totalQuests > 0
          ? ((completedQuests / totalQuests) * 100).toFixed(2) + "%"
          : "0%",
    };

    return successResponse(res, stats, `${period} quest statistics`);
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch statistics", 500);
  }
};

/* DEPRECATED: Use adminGetQuestStats with ?period=daily */
export const adminGetDailyQuestStats = async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    const [totalPlayers, playersWithQuests, totalDailyQuests, completedQuests] =
      await Promise.all([
        prisma.player.count(),
        prisma.playerQuest.groupBy({
          by: ["player_id"],
          where: {
            quest_period: "daily",
            expires_at: { gte: startOfDay },
          },
        }),
        prisma.playerQuest.count({
          where: {
            quest_period: "daily",
            expires_at: { gte: startOfDay },
          },
        }),
        prisma.playerQuest.count({
          where: {
            quest_period: "daily",
            expires_at: { gte: startOfDay },
            is_completed: true,
          },
        }),
      ]);

    const stats = {
      totalPlayers,
      playersWithDailyQuests: playersWithQuests.length,
      playersMissingQuests: totalPlayers - playersWithQuests.length,
      totalDailyQuestsToday: totalDailyQuests,
      completedQuestsToday: completedQuests,
      completionRate:
        totalDailyQuests > 0
          ? ((completedQuests / totalDailyQuests) * 100).toFixed(2) + "%"
          : "0%",
    };

    return successResponse(res, stats, "Daily quest statistics");
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch statistics", 500);
  }
};
