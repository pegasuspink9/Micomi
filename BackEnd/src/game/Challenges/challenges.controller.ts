import { Request, Response } from "express";
import {
  submitChallengeService,
  deleteChallengeAnswer,
} from "./challenges.service";
import { SubmitChallengeControllerResult } from "./challenges.types";
import { successResponse, errorResponse } from "../../../utils/response";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const submitChallenge = async (req: Request, res: Response) => {
  const playerId = Number(req.params.playerId);
  const levelId = Number(req.params.levelId);
  const challengeId = Number(req.params.challengeId);
  const { answer } = req.body;

  try {
    if (!Array.isArray(answer)) {
      return res
        .status(400)
        .json({ error: "Answer must be an array of strings" });
    }

    if (!answer.every((item) => typeof item === "string")) {
      return res
        .status(400)
        .json({ error: "All answer elements must be strings" });
    }

    const result = await submitChallengeService(
      playerId,
      levelId,
      challengeId,
      answer
    );

    const playerProgress = await prisma.playerProgress.findUnique({
      where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    });

    if (!playerProgress) {
      return successResponse(res, result, "Challenge successfully submitted.");
    }

    const isLevelCompleted = playerProgress.is_completed;
    const battleWon = playerProgress.battle_status === "won";
    const battleLost = playerProgress.battle_status === "lost";
    const canProceed = isLevelCompleted && battleWon;

    const enhancedResult: SubmitChallengeControllerResult = {
      ...result,
      levelStatus: {
        isCompleted: isLevelCompleted,
        battleWon,
        battleLost,
        canProceed,
        showFeedback: canProceed,
        playerHealth: playerProgress.player_hp,
        enemyHealth: playerProgress.enemy_hp,
      },
    };

    let message = "Challenge successfully submitted.";

    if (battleLost) {
      message = "Game Over! You were defeated. Try again!";
    } else if (canProceed) {
      message = "Level completed! Well done, warrior!";

      const [level, player] = await Promise.all([
        prisma.level.findUnique({
          where: { level_id: levelId },
          select: {
            feedback_message: true,
            map_id: true,
            level_number: true,
            points_reward: true,
          },
        }),
        prisma.player.findUnique({
          where: { player_id: playerId },
          select: { total_points: true, exp_points: true },
        }),
      ]);

      if (level && player) {
        enhancedResult.completionRewards = {
          feedbackMessage: level.feedback_message,
          currentTotalPoints: player.total_points,
          currentExpPoints: player.exp_points,
        };

        const nextLevel = await prisma.level.findFirst({
          where: {
            map_id: level.map_id,
            level_number: level.level_number + 1,
          },
          select: {
            level_id: true,
            level_number: true,
            is_unlocked: true,
          },
        });

        if (nextLevel) {
          enhancedResult.nextLevel = nextLevel;
        }
      }
    }

    return successResponse(res, enhancedResult, message);
  } catch (error) {
    return errorResponse(
      res,
      "Something went wrong.",
      (error as Error).message,
      400
    );
  }
};

export const deleteChallengeAnswerController = async (
  req: Request,
  res: Response
) => {
  const playerId = Number(req.params.playerId);
  const levelId = Number(req.params.levelId);
  const challengeId = Number(req.params.challengeId);

  try {
    const result = await deleteChallengeAnswer(playerId, levelId, challengeId);
    return res.json(result);
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: (error as Error).message });
  }
};
