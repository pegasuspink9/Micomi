import { PrismaClient, QuestType } from "@prisma/client";

const prisma = new PrismaClient();

export async function updateQuestProgress(
  playerId: number,
  type: QuestType,
  increment: number
) {
  return await prisma.$transaction(async (tx) => {
    const playerQuests = await tx.playerQuest.findMany({
      where: {
        player_id: playerId,
        Quest: { objective_type: type },   
        is_completed: false,
      },
      include: { Quest: true },    
    });

    const results = [];

    for (const pq of playerQuests) {
      const newValue = Math.max(0, pq.current_value + increment);
      const completed = newValue >= pq.Quest.target_value; // <-- pq.Quest

      const updatedPQ = await tx.playerQuest.update({
        where: { player_quest_id: pq.player_quest_id },
        data: {
          current_value: newValue,
          is_completed: completed,
          completed_at: completed ? new Date() : null,
        },
        include: { Quest: true },         // <-- include `Quest`
      });

      results.push(updatedPQ);
    }

    return results;
  });
}

export async function claimQuestReward(playerId: number, questId: number) {
  return await prisma.$transaction(async (tx) => {
    const playerQuest = await tx.playerQuest.findUnique({
      where: {
        player_id_quest_id: { player_id: playerId, quest_id: questId },
      },
      include: { Quest: true },           // <-- include `Quest`
    });

    if (!playerQuest) throw new Error("Quest not found for this player.");
    if (!playerQuest.is_completed) throw new Error("Quest not yet completed.");
    if (playerQuest.is_claimed) throw new Error("Reward already claimed.");

    await tx.player.update({
      where: { player_id: playerId },
      data: {
        exp_points: { increment: playerQuest.Quest.reward_exp }, // <-- .Quest
        coins: { increment: playerQuest.Quest.reward_coins },    // <-- .Quest
      },
    });

    const updatedPQ = await tx.playerQuest.update({
      where: { player_quest_id: playerQuest.player_quest_id },
      data: { is_claimed: true },
      include: { Quest: true },           // <-- include `Quest`
    });

    return {
      message: "Reward claimed successfully!",
      rewards: {
        exp: playerQuest.Quest.reward_exp,
        coins: playerQuest.Quest.reward_coins,
      },
      quest: updatedPQ,
    };
  });
}
