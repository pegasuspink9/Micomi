import { PrismaClient, QuestType } from "@prisma/client";
import { updateQuestProgress } from "../src/game/Quests/quests.service";
import { checkAchievements } from "../src/game/Achievements/achievements.service";
import { updatePlayerActivity } from "../src/models/Player/player.service";

const prisma = new PrismaClient();

export const handleGooglePayload = async (payload: {
  sub: string;
  email: string;
  name?: string;
}) => {
  let player = await prisma.player.findUnique({
    where: { google_id: payload.sub },
  });

  if (!player) {
    const existingPlayer = await prisma.player.findUnique({
      where: { email: payload.email },
    });

    if (existingPlayer) {
      player = await prisma.player.update({
        where: { player_id: existingPlayer.player_id },
        data: {
          google_id: payload.sub,
        },
      });
    } else {
      player = await prisma.player.create({
        data: {
          player_name: payload.name || "Player",
          email: payload.email,
          username: `user_${payload.sub.slice(0, 10)}`,
          google_id: payload.sub,
          password: null,
          created_at: new Date(),
          last_active: new Date(),
          days_logged_in: 0,
          current_streak: 0,
          longest_streak: 0,
          coins: 0,
          exp_points: 0,
          level: 1,
        },
      });
    }
  }

  const updatedPlayer = await updatePlayerActivity(player.player_id);
  if (updatedPlayer) {
    await updateQuestProgress(player.player_id, QuestType.login_days, 1);
    await checkAchievements(player.player_id);
  }

  return player;
};
