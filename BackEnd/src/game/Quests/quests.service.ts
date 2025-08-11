import { PrismaClient, QuestType } from "@prisma/client";

const prisma = new PrismaClient();

export async function updateQuestProgress(
  playerId: number,
  type: QuestType,
  increment = 1
) {
  return await prisma.$transaction(async (tx) => {
    const quests = await tx.quest.findMany({
      where: {
        player_id: playerId,
        objective_type: type,
        is_completed: false,
      },
    });

    const results = [];

    for (const quest of quests) {
      const newValue = quest.current_value + increment;
      const completed = newValue >= quest.target_value;

      const updatedQuest = await tx.quest.update({
        where: { quest_id: quest.quest_id },
        data: {
          current_value: newValue,
          is_completed: completed,
          completed_at: completed ? new Date() : null,
        },
      });

      if (completed) {
        await tx.player.update({
          where: { player_id: playerId },
          data: {
            exp_points: { increment: quest.reward_exp },
            coins: { increment: quest.reward_coins },
          },
        });
      }

      results.push(updatedQuest);
    }

    return results;
  });
}
