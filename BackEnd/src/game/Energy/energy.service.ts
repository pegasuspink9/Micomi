import { PrismaClient } from "@prisma/client";
import { formatTimeInHours } from "../../../helper/dateTimeHelper";

const prisma = new PrismaClient();

const MAX_ENERGY = 5;
const ENERGY_RESTORE_INTERVAL = 30 * 60 * 1000;

export const updatePlayerEnergy = async (playerId: number) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });

  if (!player) throw new Error("Player not found");

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

export const deductEnergy = async (playerId: number, amount: number = 1) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!player) throw new Error("Player not found");

  await updatePlayerEnergy(playerId);

  const updatedPlayer = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!updatedPlayer) throw new Error("Player not found after update");

  if (updatedPlayer.energy <= 0) {
    throw new Error("Not enough energy to perform this action");
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

  return {
    energy: status.energy,
    energyResetAt: status.energyResetAt,
    restoreInMs: status.timeToNextRestore,
    timeToNextRestore: status.timeToNextRestore
      ? formatTimeInHours(status.timeToNextRestore)
      : null,
  };
};

export const hasEnoughEnergy = async (
  playerId: number,
  required: number = 1
): Promise<boolean> => {
  const energyStatus = await updatePlayerEnergy(playerId);
  return energyStatus.energy >= required;
};
