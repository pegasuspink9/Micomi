import { prisma } from "../../../prisma/client";
import { formatTimeInHours } from "../../../helper/dateTimeHelper";

const MAX_ENERGY = 100;
const ENERGY_RESTORE_INTERVAL = 60 * 60 * 1000;
const ENERGY_RESTORE_AMOUNT = 25;

const isInfiniteEnergyActive = (
  player: {
    has_infinite_energy: boolean;
    infinite_energy_expires_at?: Date | null;
  },
  now: Date,
) => {
  return (
    player.has_infinite_energy ||
    (!!player.infinite_energy_expires_at &&
      player.infinite_energy_expires_at > now)
  );
};

export const updatePlayerEnergy = async (playerId: number) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });

  if (!player) return { message: "Player not found", success: false };

  const now = new Date();
  const hasInfinite = isInfiniteEnergyActive(player, now);

  if (
    !player.has_infinite_energy &&
    player.infinite_energy_expires_at &&
    player.infinite_energy_expires_at <= now
  ) {
    await prisma.player.update({
      where: { player_id: playerId },
      data: { infinite_energy_expires_at: null },
    });
  }

  if (hasInfinite) {
    return {
      energy: MAX_ENERGY,
      energyResetAt: null,
      timeToNextRestore: null,
      isInfinite: true,
    };
  }

  let currentEnergy = player.energy;
  let energyResetAt = player.energy_reset_at;
  let timeToNextRestore: number | null = null;

  if (currentEnergy < MAX_ENERGY) {
    if (!energyResetAt) {
      energyResetAt = new Date(now.getTime() + ENERGY_RESTORE_INTERVAL);

      await prisma.player.update({
        where: { player_id: playerId },
        data: { energy_reset_at: energyResetAt },
      });
    }

    // Check if the target time has been reached or passed
    if (energyResetAt && now.getTime() >= energyResetAt.getTime()) {
      const timePastTarget = now.getTime() - energyResetAt.getTime();

      // Calculate how many intervals passed (minimum 1 since target is reached)
      const ticksEarned =
        1 + Math.floor(timePastTarget / ENERGY_RESTORE_INTERVAL);

      const energyToRestore = ticksEarned * ENERGY_RESTORE_AMOUNT;

      currentEnergy = Math.min(MAX_ENERGY, currentEnergy + energyToRestore);

      // Update the next reset time (or null if full)
      energyResetAt =
        currentEnergy >= MAX_ENERGY
          ? null
          : new Date(
              energyResetAt.getTime() + ticksEarned * ENERGY_RESTORE_INTERVAL,
            );

      await prisma.player.update({
        where: { player_id: playerId },
        data: {
          energy: currentEnergy,
          energy_reset_at: energyResetAt,
        },
      });
    }

    // Calculate time left for the UI (Frontend countdown)
    if (energyResetAt) {
      timeToNextRestore = Math.max(0, energyResetAt.getTime() - now.getTime());
    }
  }

  return {
    energy: currentEnergy,
    energyResetAt,
    timeToNextRestore,
    isInfinite: false,
  };
};

export const deductEnergy = async (playerId: number, amount: number = 5) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!player) return { message: "Player not found", success: false };

  if (isInfiniteEnergyActive(player, new Date())) {
    return {
      energy: MAX_ENERGY,
      energyResetAt: null,
      timeToNextRestore: null,
      isInfinite: true,
      success: true,
    };
  }

  await updatePlayerEnergy(playerId);

  const updatedPlayer = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!updatedPlayer)
    return { message: "Player not found after update", success: false };

  const now = new Date();
  let energyResetAt = updatedPlayer.energy_reset_at;

  if (updatedPlayer.energy < amount) {
    if (!energyResetAt || energyResetAt.getTime() <= now.getTime()) {
      energyResetAt = new Date(now.getTime() + ENERGY_RESTORE_INTERVAL);
      await prisma.player.update({
        where: { player_id: playerId },
        data: { energy_reset_at: energyResetAt },
      });
    }

    return {
      message: `System battery low! You need ${amount} energy to execute this task.`,
      success: false,
      energy: updatedPlayer.energy,
      energyResetAt,
      timeToNextRestore: energyResetAt
        ? energyResetAt.getTime() - now.getTime()
        : null,
      isInfinite: false,
    };
  }

  const newEnergy = Math.max(0, updatedPlayer.energy - amount);

  if (
    !energyResetAt ||
    updatedPlayer.energy === MAX_ENERGY ||
    energyResetAt.getTime() <= now.getTime()
  ) {
    energyResetAt = new Date(now.getTime() + ENERGY_RESTORE_INTERVAL);
  }

  await prisma.player.update({
    where: { player_id: playerId },
    data: {
      energy: newEnergy,
      energy_reset_at: energyResetAt,
    },
  });

  return {
    energy: newEnergy,
    energyResetAt,
    timeToNextRestore: energyResetAt.getTime() - now.getTime(),
    isInfinite: false,
    success: true,
  };
};

export const getPlayerEnergyStatus = async (playerId: number) => {
  const status = await updatePlayerEnergy(playerId);

  if ("success" in status && !status.success) {
    return {
      energy: 0,
      energyResetAt: null,
      restoreInMs: null,
      timeToNextRestore: null,
      isInfinite: false,
    };
  }

  if ("isInfinite" in status && status.isInfinite) {
    return {
      energy: status.energy,
      energyResetAt: null,
      restoreInMs: null,
      timeToNextRestore: "Infinite",
      isInfinite: true,
    };
  }

  return {
    energy: status.energy,
    energyResetAt: status.energyResetAt,
    restoreInMs: status.timeToNextRestore,
    timeToNextRestore: status.timeToNextRestore
      ? formatTimeInHours(status.timeToNextRestore)
      : null,
    isInfinite: false,
  };
};

export const hasEnoughEnergy = async (
  playerId: number,
  required: number = 5,
): Promise<boolean> => {
  const energyStatus = await updatePlayerEnergy(playerId);

  if ("success" in energyStatus && !energyStatus.success) {
    return false;
  }

  if ("isInfinite" in energyStatus && energyStatus.isInfinite) {
    return true;
  }

  return (energyStatus.energy ?? 0) >= required;
};

export const rewardAdEnergy = async (
  playerId: number,
  rewardAmount: number = 25,
) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });

  if (!player) return { message: "Player not found", success: false };

  if (isInfiniteEnergyActive(player, new Date())) {
    return { success: true, energy: MAX_ENERGY, isInfinite: true };
  }

  const newEnergy = Math.min(MAX_ENERGY, player.energy + rewardAmount);

  const newResetAt = newEnergy >= MAX_ENERGY ? null : player.energy_reset_at;

  await prisma.player.update({
    where: { player_id: playerId },
    data: {
      energy: newEnergy,
      energy_reset_at: newResetAt,
    },
  });

  return {
    success: true,
    energy: newEnergy,
    message: `Rewarded ${rewardAmount} energy!`,
  };
};

export const restoreEnergyForDuePlayers = async (): Promise<number> => {
  try {
    const updatedRows = await prisma.$executeRawUnsafe(`
      UPDATE "Player"
      SET 
        energy = LEAST(100, energy + ((1 + FLOOR(EXTRACT(EPOCH FROM (NOW() - energy_reset_at)) / 3600)::int) * 25)),
        
        energy_reset_at = CASE
          WHEN energy + ((1 + FLOOR(EXTRACT(EPOCH FROM (NOW() - energy_reset_at)) / 3600)::int) * 25) >= 100 
            THEN NULL
          ELSE energy_reset_at + ((1 + FLOOR(EXTRACT(EPOCH FROM (NOW() - energy_reset_at)) / 3600)::int) * INTERVAL '1 hour')
        END
        
      WHERE has_infinite_energy = false
        AND (infinite_energy_expires_at IS NULL OR infinite_energy_expires_at <= NOW())
        AND energy < 100
        AND energy_reset_at IS NOT NULL
        AND energy_reset_at <= NOW();
    `);

    return updatedRows;
  } catch (error: any) {
    console.error("[Energy Restore] Failed to restore energy:", error);
    throw new Error("Failed to restore energy for due players");
  }
};
