import { success } from "zod";
import { prisma } from "../prisma/client";
import { io } from "../src/index";
import { calculatePlayerLevel } from "../src/models/Player/player.service";

type Rewards = {
  exp?: number;
  coins?: number;
  total_points?: number;
};

export const grantRewards = async (playerId: number, rewards: Rewards) => {
  const { exp = 0, coins = 0, total_points = 0 } = rewards;

  if (exp === 0 && coins === 0 && total_points === 0) return;

  return await prisma.$transaction(async (tx) => {
    const player = await tx.player.findUnique({
      where: { player_id: playerId },
      select: { exp_points: true, level: true },
    });

    if (!player) return { message: "Player not found", success: false };

    const newExp = player.exp_points + exp;
    const newLevel = exp > 0 ? calculatePlayerLevel(newExp) : player.level;

    await tx.player.update({
      where: { player_id: playerId },
      data: {
        exp_points: exp > 0 ? newExp : undefined,
        level: exp > 0 ? newLevel : undefined,
        coins: coins > 0 ? { increment: coins } : undefined,
        total_points:
          total_points > 0 ? { increment: total_points } : undefined,
      },
    });

    if (exp > 0 && newLevel > player.level) {
      io.to(playerId.toString()).emit("playerLeveledUp", {
        oldLevel: player.level,
        newLevel,
        totalExp: newExp,
      });
    }
  });
};
