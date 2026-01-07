import { PrismaClient } from "@prisma/client";
import { formatTimeInHours } from "../../../helper/dateTimeHelper";

const prisma = new PrismaClient();

const MAX_ENERGY = 25;
const ENERGY_RESTORE_INTERVAL = 30 * 60 * 1000;

export const updatePlayerEnergy = async (playerId: number) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });

  if (!player) return { message: "Player not found", success: false };

  const now = new Date();
  let currentEnergy = player.energy;
  let energyResetAt = player.energy_reset_at;

  let timeToNextRestore: number | null = null;

  if (currentEnergy < MAX_ENERGY) {
    if (!energyResetAt) {
      energyResetAt = new Date(now.getTime() - ENERGY_RESTORE_INTERVAL);
    }

    const timeSinceLastRestore = now.getTime() - energyResetAt.getTime();
    const energyToRestore = Math.floor(
      timeSinceLastRestore / ENERGY_RESTORE_INTERVAL
    );

    if (energyToRestore > 0) {
      currentEnergy = Math.min(MAX_ENERGY, currentEnergy + energyToRestore);

      energyResetAt =
        currentEnergy >= MAX_ENERGY
          ? null
          : new Date(
              energyResetAt.getTime() +
                energyToRestore * ENERGY_RESTORE_INTERVAL
            );

      await prisma.player.update({
        where: { player_id: playerId },
        data: {
          energy: currentEnergy,
          energy_reset_at: energyResetAt,
        },
      });
    }

    if (energyResetAt) {
      timeToNextRestore = energyResetAt.getTime() - now.getTime();
    }
  }

  return {
    energy: currentEnergy,
    energyResetAt,
    timeToNextRestore,
  };
};

export const deductEnergy = async (playerId: number, amount: number = 5) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!player) return { message: "Player not found", success: false };

  await updatePlayerEnergy(playerId);

  const updatedPlayer = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!updatedPlayer)
    return { message: "Player not found after update", success: false };

  if (updatedPlayer.energy <= 0) {
    return {
      message: "Not enough energy to perform this action",
      success: false,
    };
  }

  const newEnergy = Math.max(0, updatedPlayer.energy - amount);
  const now = new Date();
  let energyResetAt = updatedPlayer.energy_reset_at;

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
      success: false,
    };
  }

  return {
    energy: status.energy,
    energyResetAt: status.energyResetAt,
    restoreInMs: status.timeToNextRestore,
    timeToNextRestore: status.timeToNextRestore
      ? formatTimeInHours(status.timeToNextRestore)
      : null,
    success: true,
  };
};

export const hasEnoughEnergy = async (
  playerId: number,
  required: number = 5
): Promise<boolean> => {
  const energyStatus = await updatePlayerEnergy(playerId);
  if ("success" in energyStatus && !energyStatus.success) {
    return false;
  }
  return (energyStatus.energy ?? 0) >= required;
};
