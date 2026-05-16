import { prisma } from "../../../prisma/client";
import { AdRewardResult } from "./ads.types";

const MAX_ENERGY = 100;

export const rewardAdEnergy = async (
  playerId: number,
  amount: number = 25,
): Promise<AdRewardResult> => {
  try {
    const player = await prisma.player.findUnique({
      where: { player_id: playerId },
    });
    if (!player) return { success: false, message: "Player not found" };

    if (amount <= 0) {
      return { success: false, message: "Invalid reward amount" };
    }

    const newEnergy = Math.min(MAX_ENERGY, player.energy + amount);

    const updatedPlayer = await prisma.player.update({
      where: { player_id: playerId },
      data: { energy: newEnergy },
    });

    return {
      success: true,
      message: `Successfully rewarded ${amount} energy`,
      energyAdded: amount,
      currentEnergy: updatedPlayer.energy,
    };
  } catch (error: any) {
    console.error("rewardAdEnergy error:", error);
    return {
      success: false,
      message: error.message || "Failed to reward energy",
    };
  }
};
