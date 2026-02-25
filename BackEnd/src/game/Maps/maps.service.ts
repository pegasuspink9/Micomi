import { PrismaClient } from "@prisma/client";
import { isMapUnlockedForPlayer } from "../Levels/levels.service";

const prisma = new PrismaClient();

const SPECIAL_BUTTON_TYPES = ["micomiButton", "shopButton"] as const;

export const selectMap = async (playerId: number, mapId: number) => {
  let map = await prisma.map.findUnique({
    where: { map_id: mapId },
  });

  if (!map) {
    return { message: "Map not found", success: false };
  }

  const mapUnlocked = await isMapUnlockedForPlayer(playerId, map.map_name);
  if (!mapUnlocked) {
    return { message: "Map not unlocked yet for this player", success: false };
  }

  if (!map.is_active) {
    map = await prisma.map.update({
      where: { map_id: mapId },
      data: { is_active: true, last_updated: new Date() },
    });
  }

  const existingProgress = await prisma.playerProgress.findFirst({
    where: {
      player_id: playerId,
      level: {
        map_id: mapId,
      },
    },
  });

  if (!existingProgress) {
    const firstLevel = await prisma.level.findFirst({
      where: { map_id: mapId },
      orderBy: { level_id: "asc" },
    });

    if (firstLevel) {
      const isMicomiButton = firstLevel.level_type === "micomiButton";

      await prisma.playerProgress.create({
        data: {
          player_id: playerId,
          level_id: firstLevel.level_id,
          current_level: firstLevel.level_number,
          is_completed: isMicomiButton,
          completed_at: isMicomiButton ? new Date() : null,
          attempts: 0,
          player_answer: {},
          challenge_start_time: new Date(),
          player_hp: 0,
          enemy_hp: 0,
          battle_status: "in_progress",
          coins_earned: 0,
          total_points_earned: 0,
          total_exp_points_earned: 0,
          wrong_challenges: [],
          consecutive_corrects: 0,
          consecutive_wrongs: 0,
          has_reversed_curse: false,
          has_boss_shield: false,
          has_force_character_attack_type: false,
          has_both_hp_decrease: false,
          has_permuted_ss: false,
          has_shuffle_ss: false,
          took_damage: false,
          has_strong_effect: false,
          has_freeze_effect: false,
          ...(isMicomiButton ? { done_micomi_level: true } : {}),
        },
      });
    }
  }

  const fullMap = await prisma.map.findUnique({
    where: { map_id: mapId },
    include: {
      levels: {
        orderBy: { level_id: "asc" },
        include: {
          playerProgress: {
            where: { player_id: playerId },
            select: {
              progress_id: true,
              is_completed: true,
              stars_earned: true,
            },
          },
        },
      },
    },
  });

  if (!fullMap) {
    return { message: "Map not available", success: false };
  }

  const allPlayerProgress = await prisma.playerProgress.findMany({
    where: {
      player_id: playerId,
      level: {
        map_id: mapId,
      },
    },
    include: {
      level: true,
    },
    orderBy: {
      level: {
        level_id: "asc",
      },
    },
  });

  const latestUnlockedProgress =
    allPlayerProgress.length > 0
      ? allPlayerProgress[allPlayerProgress.length - 1]
      : null;

  const enhancedMap = {
    ...fullMap,
    levels: fullMap.levels.map((level, index) => {
      let isUnlocked = index === 0;

      if (!isUnlocked) {
        isUnlocked = !!level.playerProgress.length;
      }

      return {
        ...level,
        level_number: SPECIAL_BUTTON_TYPES.includes(level.level_type as any)
          ? null
          : level.level_number,
        is_unlocked: isUnlocked,
        isCurrentUnlocked: latestUnlockedProgress
          ? level.level_id === latestUnlockedProgress.level_id
          : index === 0,
      };
    }),
  };

  return {
    map: enhancedMap,
    audio: "https://micomi-assets.me/Sounds/Final/Navigation.mp3",
  };
};
