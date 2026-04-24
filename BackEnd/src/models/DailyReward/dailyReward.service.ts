import { Request, Response } from "express";
import { differenceInCalendarDays } from "date-fns";
import { prisma } from "../../../prisma/client";
import { successResponse, errorResponse } from "../../../utils/response";
import { io } from "../../index";
import { calculatePlayerLevel } from "../Player/player.service";

const DAILY_REWARDS = [
  { day: 1, coins: 50, exp: 20 },
  { day: 2, coins: 75, exp: 30 },
  { day: 3, coins: 100, exp: 40 },
  { day: 4, coins: 125, exp: 50 },
  { day: 5, coins: 150, exp: 60 },
  { day: 6, coins: 200, exp: 80 },
  { day: 7, coins: 300, exp: 120 },
] as const;

const getCurrentRewardDay = (
  dailyRewardDay: number,
  lastClaimedAt: Date | null,
  now: Date,
): number => {
  if (!lastClaimedAt || dailyRewardDay <= 0 || dailyRewardDay > 7) {
    return 1;
  }

  const diffDays = differenceInCalendarDays(now, lastClaimedAt);

  if (diffDays <= 0) {
    return dailyRewardDay;
  }

  if (diffDays === 1) {
    return dailyRewardDay >= 7 ? 1 : dailyRewardDay + 1;
  }

  return 1;
};

export const getDailyReward = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id as number;

    const player = await prisma.player.findUnique({
      where: { player_id: playerId },
      select: {
        player_id: true,
        daily_reward_day: true,
        daily_reward_last_claimed_at: true,
      },
    });

    if (!player) {
      return errorResponse(res, null, "Player not found", 404);
    }

    const now = new Date();
    const todayRewardDay = getCurrentRewardDay(
      player.daily_reward_day,
      player.daily_reward_last_claimed_at,
      now,
    );

    const alreadyClaimedToday =
      !!player.daily_reward_last_claimed_at &&
      differenceInCalendarDays(now, player.daily_reward_last_claimed_at) === 0;

    const rewards = DAILY_REWARDS.map((reward) => ({
      reward_id: reward.day,
      ...reward,
      is_current: reward.day === todayRewardDay,
      is_claimed:
        reward.day < todayRewardDay ||
        (alreadyClaimedToday && reward.day === todayRewardDay),
    }));

    return successResponse(
      res,
      {
        current_day: todayRewardDay,
        can_claim_today: !alreadyClaimedToday,
        last_claimed_at: player.daily_reward_last_claimed_at,
        rewards,
      },
      "Daily reward fetched",
    );
  } catch (error) {
    return errorResponse(res, error, "Failed to fetch daily reward", 500);
  }
};

export const claimDailyReward = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id as number;
    const rewardId = Number(req.params.rewardId);

    if (!Number.isInteger(rewardId) || rewardId < 1 || rewardId > 7) {
      return errorResponse(res, null, "Invalid rewardId. Must be 1-7", 400);
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({
        where: { player_id: playerId },
        select: {
          player_id: true,
          exp_points: true,
          level: true,
          daily_reward_day: true,
          daily_reward_last_claimed_at: true,
        },
      });

      if (!player) {
        return {
          success: false as const,
          status: 404,
          message: "Player not found",
        };
      }

      const todayRewardDay = getCurrentRewardDay(
        player.daily_reward_day,
        player.daily_reward_last_claimed_at,
        now,
      );

      const alreadyClaimedToday =
        !!player.daily_reward_last_claimed_at &&
        differenceInCalendarDays(now, player.daily_reward_last_claimed_at) ===
          0;

      if (alreadyClaimedToday) {
        return {
          success: false as const,
          status: 400,
          message: "Daily reward already claimed today",
        };
      }

      if (rewardId !== todayRewardDay) {
        return {
          success: false as const,
          status: 400,
          message: `Today you can only claim Day ${todayRewardDay}`,
        };
      }

      const reward = DAILY_REWARDS.find((item) => item.day === rewardId)!;
      const newExp = player.exp_points + reward.exp;
      const newLevel = calculatePlayerLevel(newExp);

      await tx.player.update({
        where: { player_id: playerId },
        data: {
          coins: { increment: reward.coins },
          exp_points: newExp,
          level: newLevel,
          daily_reward_day: rewardId,
          daily_reward_last_claimed_at: now,
        },
      });

      return {
        success: true as const,
        data: {
          claimed_day: rewardId,
          reward,
          next_claim_day: rewardId >= 7 ? 1 : rewardId + 1,
          claimed_at: now,
          level_up: newLevel > player.level,
          old_level: player.level,
          new_level: newLevel,
          total_exp: newExp,
        },
      };
    });

    if (!result.success) {
      return errorResponse(res, null, result.message, result.status);
    }

    if (result.data.level_up) {
      io.to(playerId.toString()).emit("playerLeveledUp", {
        oldLevel: result.data.old_level,
        newLevel: result.data.new_level,
        totalExp: result.data.total_exp,
      });
    }

    return successResponse(res, result.data, "Daily reward claimed");
  } catch (error) {
    return errorResponse(res, error, "Failed to claim daily reward", 500);
  }
};
