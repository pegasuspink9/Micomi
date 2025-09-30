import { Request, Response } from "express";
import * as CombatService from "./combat.service";
import * as AchievementService from "../Achievements/achievements.service";
import { successResponse, errorResponse } from "../../../utils/response";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const performFight = async (req: Request, res: Response) => {
  const playerId = (req as any).user.id;
  const { levelId, isCorrect, correctCount, totalCount } = req.body;

  try {
    if (!playerId || !levelId) {
      return errorResponse(
        res,
        null,
        "Player ID and Level ID are required",
        400
      );
    }

    const parsedPlayerId = parseInt(playerId, 10);
    const parsedLevelId = parseInt(levelId, 10);
    if (isNaN(parsedPlayerId) || isNaN(parsedLevelId)) {
      return errorResponse(res, null, "Invalid player or level ID", 400);
    }

    const level = await prisma.level.findUnique({
      where: { level_id: parsedLevelId },
      include: { enemy: true },
    });
    if (!level || !level.enemy) {
      return errorResponse(res, null, "Level or Enemy not found", 404);
    }

    const { level_difficulty, map_id, level_number } = level;
    let result;

    if (level_difficulty === "easy") {
      if (typeof isCorrect !== "boolean") {
        return errorResponse(
          res,
          null,
          "isCorrect must be provided for this fight type",
          400
        );
      }

      result = await CombatService.fightEnemy(
        parsedPlayerId,
        parsedLevelId,
        isCorrect
      );
    } else if (level_difficulty === "hard" || level_difficulty === "final") {
      if (typeof correctCount !== "number" || typeof totalCount !== "number") {
        return errorResponse(
          res,
          null,
          "correctCount and totalCount must be provided for this fight type",
          400
        );
      }

      result = await CombatService.fightBossEnemy(
        parsedPlayerId,
        parsedLevelId,
        correctCount,
        totalCount
      );

      if (level_difficulty === "final" && result.status === "won") {
        const nextMap = await prisma.map.findFirst({
          where: { map_id: { gt: map_id }, is_active: false },
          orderBy: { map_id: "asc" },
        });
        if (nextMap) {
          await prisma.map.update({
            where: { map_id: nextMap.map_id },
            data: { is_active: true },
          });
        }
      }
    } else {
      return errorResponse(
        res,
        null,
        `Unknown level_difficulty: ${level_difficulty}`,
        400
      );
    }

    await AchievementService.checkAchievements(parsedPlayerId);
    // await AchievementService.updateLeaderboard();

    return successResponse(res, result, "Fight completed");
  } catch (error) {
    return errorResponse(res, null, (error as Error).message, 400);
  }
};
