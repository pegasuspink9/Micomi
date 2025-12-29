import { Request, Response } from "express";
import { submitChallengeService } from "./challenges.service";
import { successResponse, errorResponse } from "../../../utils/response";
import { PrismaClient } from "@prisma/client";
import { SubmitChallengeControllerResult } from "./challenges.types";

const prisma = new PrismaClient();

const reverseString = (str: string): string => str.split("").reverse().join("");

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

    const progress = await prisma.playerProgress.findUnique({
      where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    });
    if (!progress) {
      return errorResponse(res, null, "No progress found for this level", 404);
    }

    const currentChallenge = await prisma.challenge.findUnique({
      where: { challenge_id: challengeId },
    });
    if (!currentChallenge) {
      return errorResponse(res, null, "Challenge not found", 404);
    }

    let effectiveCorrectAnswer = currentChallenge.correct_answer as string[];
    const playerAnswer =
      progress.player_answer && typeof progress.player_answer === "object"
        ? (progress.player_answer as Record<string, unknown>)
        : {};
    const challengeKey = challengeId.toString();

    const level = await prisma.level.findUnique({
      where: { level_id: levelId },
      include: { enemy: true },
    });
    const enemy = level?.enemy;
    if (progress.has_reversed_curse && enemy?.enemy_name === "King Grimnir") {
      effectiveCorrectAnswer = effectiveCorrectAnswer.map(reverseString);
    }

    const submittedAnswer = answer;
    const isHinted =
      (playerAnswer[challengeKey] as string[] | undefined)?.length ===
      effectiveCorrectAnswer.length;
    let adjustedAnswer = submittedAnswer;

    if (isHinted && submittedAnswer.join("").toLowerCase() === "next") {
      adjustedAnswer = effectiveCorrectAnswer;
      console.log(
        `Hinted challenge ${challengeId}: "next" submitted, overriding to correct answer`
      );
    } else {
      console.log(`Standard submission for challenge ${challengeId}`);
    }

    const result = await submitChallengeService(
      playerId,
      levelId,
      challengeId,
      adjustedAnswer
    );

    // Handle error responses from service
    if (!result.success && result.success === false) {
      return errorResponse(res, null, result.message, 400);
    }

    const freshProgress = await prisma.playerProgress.findUnique({
      where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    });

    if (!freshProgress) {
      return successResponse(res, result, "Challenge successfully submitted.");
    }

    const isLevelCompleted = freshProgress.is_completed;
    const battleWon = freshProgress.battle_status === "won";
    const battleLost = freshProgress.battle_status === "lost";
    const canProceed = isLevelCompleted && battleWon;

    const enhancedResult: SubmitChallengeControllerResult = {
      ...result,
      levelStatus: {
        ...result.levelStatus,
        isCompleted: isLevelCompleted,
        showFeedback: canProceed,
      },
      completionRewards: result.completionRewards ?? undefined,
      nextLevel: result.nextLevel ?? null,
    };

    let message = "Challenge successfully submitted.";

    if (battleLost) {
      message = "Game Over! You were defeated. Try again!";
    } else if (canProceed) {
      message = "Level completed! Well done, warrior!";

      const level = await prisma.level.findUnique({
        where: { level_id: levelId },
        select: {
          feedback_message: true,
          map_id: true,
          level_number: true,
        },
      });

      if (level) {
        enhancedResult.completionRewards = {
          feedbackMessage:
            result.completionRewards?.feedbackMessage ??
            level.feedback_message ??
            `Level ${level.level_number} completed!`,
          coinsEarned: result.levelStatus?.coinsEarned ?? 0,
          totalPointsEarned: result.levelStatus?.totalPointsEarned ?? 0,
          totalExpPointsEarned: result.levelStatus?.totalExpPointsEarned ?? 0,
          stars: result.completionRewards?.stars ?? 0,
          playerOutputs: result.levelStatus?.playerOutputs ?? [],
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
    console.error("Error in submitChallenge:", error);
    return errorResponse(
      res,
      "Challenge submission failed.",
      (error as Error).message,
      400
    );
  }
};
