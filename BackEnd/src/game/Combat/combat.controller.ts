import { Request, Response } from "express";
import * as CombatService from "./combat.service";
import * as AchievementService from "../Achievements/achievements.service";
import { successResponse, errorResponse } from "../../../utils/response";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const performFight = async (req: Request, res: Response) => {
  const playerId = (req as any).user.id;
  const { enemyId, isCorrect, correctCount, totalCount } = req.body;

  try {
    if (!playerId || !enemyId) {
      return errorResponse(
        res,
        null,
        "Player ID and Enemy ID are required",
        400
      );
    }

    const parsedPlayerId = parseInt(playerId, 10);
    const parsedEnemyId = parseInt(enemyId, 10);
    if (isNaN(parsedPlayerId) || isNaN(parsedEnemyId)) {
      return errorResponse(res, null, "Invalid player or enemy ID", 400);
    }

    const enemy = await prisma.enemy.findUnique({
      where: { enemy_id: parsedEnemyId },
      include: { level: true },
    });
    if (!enemy || !enemy.level) {
      return errorResponse(res, null, "Enemy or Level not found", 404);
    }

    const { level_type, map_id, level_number } = enemy.level;
    let result;

    if (level_type === "easy" || level_type === "medium") {
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
        parsedEnemyId,
        isCorrect
      );
    } else if (level_type === "hard" || level_type === "final") {
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
        parsedEnemyId,
        correctCount,
        totalCount
      );

      if (level_type === "final" && result.status === "won") {
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
      return errorResponse(res, null, `Unknown level_type: ${level_type}`, 400);
    }

    await AchievementService.checkAchievements(parsedPlayerId);
    // await AchievementService.updateLeaderboard();

    return successResponse(res, result, "Fight completed");
  } catch (error) {
    return errorResponse(res, null, (error as Error).message, 400);
  }
};
