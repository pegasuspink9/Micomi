import { QuestType } from "@prisma/client";
import { prisma } from "../../../prisma/client";

export async function updateQuestProgress(
  playerId: number,
  type: QuestType,
  increment: number
) {
  console.log("🎯 updateQuestProgress called:", { playerId, type, increment });

  const allQuests = await prisma.playerQuest.findMany({
    where: {
      player_id: playerId,
      quest: { objective_type: type },
    },
    include: { quest: true },
  });

  console.log(
    "📊 ALL quests for player (including completed):",
    allQuests.map((q) => ({
      player_quest_id: q.player_quest_id,
      quest_id: q.quest_id,
      title: q.quest.title,
      current_value: q.current_value,
      target_value: q.quest.target_value,
      is_completed: q.is_completed,
      is_claimed: q.is_claimed,
    }))
  );

  const playerQuests = await prisma.playerQuest.findMany({
    where: {
      player_id: playerId,
      quest: { objective_type: type },
      is_completed: false,
    },
    include: { quest: true },
  });

  console.log(
    "📋 Found INCOMPLETE quests:",
    playerQuests.length,
    playerQuests.map((q) => ({
      quest_id: q.quest_id,
      title: q.quest.title,
      current_value: q.current_value,
      target_value: q.quest.target_value,
    }))
  );

  const results = [];

  for (const pq of playerQuests) {
    const newValue = Math.max(0, pq.current_value + increment);
    const completed = newValue >= pq.quest.target_value;

    console.log(
      `  ➡️ Updating quest ${pq.quest.title}: ${pq.current_value} → ${newValue} (target: ${pq.quest.target_value})`
    );

    const updatedPQ = await prisma.playerQuest.update({
      where: { player_quest_id: pq.player_quest_id },
      data: {
        current_value: newValue,
        is_completed: completed,
        completed_at: completed ? new Date() : null,
      },
      include: { quest: true },
    });

    console.log(`  ✅ Updated successfully: ${updatedPQ.current_value}`);
    results.push(updatedPQ);
  }

  console.log(
    "🎯 updateQuestProgress completed, updated",
    results.length,
    "quests"
  );
  return results;
}

export async function claimQuestReward(playerId: number, questId: number) {
  return await prisma.$transaction(async (tx) => {
    const playerQuest = await tx.playerQuest.findUnique({
      where: {
        player_id_quest_id: { player_id: playerId, quest_id: questId },
      },
      include: { quest: true },
    });

    if (!playerQuest) throw new Error("Quest not found for this player.");
    if (!playerQuest.is_completed) throw new Error("Quest not yet completed.");
    if (playerQuest.is_claimed) throw new Error("Reward already claimed.");

    await tx.player.update({
      where: { player_id: playerId },
      data: {
        exp_points: { increment: playerQuest.quest.reward_exp },
        coins: { increment: playerQuest.quest.reward_coins },
      },
    });

    const updatedPQ = await tx.playerQuest.update({
      where: { player_quest_id: playerQuest.player_quest_id },
      data: { is_claimed: true },
      include: { quest: true },
    });

    return {
      message: "Reward claimed successfully!",
      rewards: {
        exp: playerQuest.quest.reward_exp,
        coins: playerQuest.quest.reward_coins,
      },
      quest: updatedPQ,
    };
  });
}
