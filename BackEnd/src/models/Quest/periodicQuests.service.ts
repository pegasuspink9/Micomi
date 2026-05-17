import { prisma } from "../../../prisma/client";
import { QuestType, QuestPeriod } from "@prisma/client";

interface QuestTemplate {
  objective_type: QuestType;
  titleTemplate: string;
  descriptionTemplate: string;
  minTarget: number;
  maxTarget: number;
  baseExpReward: number;
  baseCoinReward: number;
  availableFor: QuestPeriod[];
}

const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    objective_type: QuestType.defeat_enemy,
    titleTemplate: "Defeat {count} Enemies",
    descriptionTemplate: "Defeat {count} enemies in any level!",
    minTarget: 3,
    maxTarget: 10,
    baseExpReward: 50,
    baseCoinReward: 25,
    availableFor: ["daily", "weekly", "monthly"],
  },
  {
    objective_type: QuestType.solve_challenge,
    titleTemplate: "Complete {count} Challenges",
    descriptionTemplate: "Successfully solve {count} challenges!",
    minTarget: 2,
    maxTarget: 8,
    baseExpReward: 60,
    baseCoinReward: 30,
    availableFor: ["daily", "weekly", "monthly"],
  },
  {
    objective_type: QuestType.buy_potion,
    titleTemplate: "Stock Up",
    descriptionTemplate: "Purchase {count} potions from the shop!",
    minTarget: 1,
    maxTarget: 3,
    baseExpReward: 30,
    baseCoinReward: 15,
    availableFor: ["daily"],
  },
  {
    objective_type: QuestType.use_potion,
    titleTemplate: "Potion Master",
    descriptionTemplate: "Use {count} potions strategically in battle!",
    minTarget: 2,
    maxTarget: 5,
    baseExpReward: 40,
    baseCoinReward: 20,
    availableFor: ["daily"],
  },
  {
    objective_type: QuestType.complete_lesson,
    titleTemplate: "Knowledge Seeker",
    descriptionTemplate: "Complete {count} Micomi lessons!",
    minTarget: 1,
    maxTarget: 3,
    baseExpReward: 70,
    baseCoinReward: 35,
    availableFor: ["daily", "weekly"],
  },

  {
    objective_type: QuestType.defeat_enemy,
    titleTemplate: "Weekly Warrior",
    descriptionTemplate: "Defeat {count} enemies this week!",
    minTarget: 3,
    maxTarget: 8,
    baseExpReward: 300,
    baseCoinReward: 150,
    availableFor: ["weekly"],
  },
  {
    objective_type: QuestType.solve_challenge,
    titleTemplate: "Weekly Brain Teaser",
    descriptionTemplate: "Solve {count} challenges this week!",
    minTarget: 15,
    maxTarget: 40,
    baseExpReward: 350,
    baseCoinReward: 175,
    availableFor: ["weekly"],
  },
  {
    objective_type: QuestType.earn_exp,
    titleTemplate: "Weekly Grind",
    descriptionTemplate: "Earn {count} experience points this week!",
    minTarget: 500,
    maxTarget: 1500,
    baseExpReward: 400,
    baseCoinReward: 200,
    availableFor: ["weekly"],
  },
  {
    objective_type: QuestType.perfect_level,
    titleTemplate: "Weekly Perfectionist",
    descriptionTemplate: "Complete {count} levels with perfect scores!",
    minTarget: 3,
    maxTarget: 7,
    baseExpReward: 500,
    baseCoinReward: 250,
    availableFor: ["weekly"],
  },
  {
    objective_type: QuestType.defeat_boss,
    titleTemplate: "Boss Slayer",
    descriptionTemplate: "Defeat {count} bosses this week!",
    minTarget: 1,
    maxTarget: 3,
    baseExpReward: 600,
    baseCoinReward: 300,
    availableFor: ["weekly"],
  },
  {
    objective_type: QuestType.login_days,
    titleTemplate: "Dedicated Player",
    descriptionTemplate: "Login for {count} days this week!",
    minTarget: 4,
    maxTarget: 7,
    baseExpReward: 450,
    baseCoinReward: 225,
    availableFor: ["weekly"],
  },

  {
    objective_type: QuestType.defeat_enemy,
    titleTemplate: "Monthly Conqueror",
    descriptionTemplate: "Defeat {count} enemies this month!",
    minTarget: 30,
    maxTarget: 52,
    baseExpReward: 1500,
    baseCoinReward: 750,
    availableFor: ["monthly"],
  },
  {
    objective_type: QuestType.solve_challenge,
    titleTemplate: "Monthly Master",
    descriptionTemplate: "Solve {count} challenges this month!",
    minTarget: 80,
    maxTarget: 150,
    baseExpReward: 1800,
    baseCoinReward: 900,
    availableFor: ["monthly"],
  },
  {
    objective_type: QuestType.earn_exp,
    titleTemplate: "Monthly Legend",
    descriptionTemplate: "Earn {count} experience points this month!",
    minTarget: 3000,
    maxTarget: 7000,
    baseExpReward: 2000,
    baseCoinReward: 1000,
    availableFor: ["monthly"],
  },
  {
    objective_type: QuestType.reach_level,
    titleTemplate: "Level Climber",
    descriptionTemplate: "Reach level {count} this month!",
    minTarget: 10,
    maxTarget: 25,
    baseExpReward: 2500,
    baseCoinReward: 1250,
    availableFor: ["monthly"],
  },
  {
    objective_type: QuestType.unlock_character,
    titleTemplate: "Character Collector",
    descriptionTemplate: "Unlock {count} characters this month!",
    minTarget: 2,
    maxTarget: 4,
    baseExpReward: 3000,
    baseCoinReward: 1500,
    availableFor: ["monthly"],
  },
  {
    objective_type: QuestType.defeat_boss,
    titleTemplate: "Boss Dominator",
    descriptionTemplate: "Defeat {count} bosses this month!",
    minTarget: 3,
    maxTarget: 12,
    baseExpReward: 2800,
    baseCoinReward: 1400,
    availableFor: ["monthly"],
  },
  {
    objective_type: QuestType.spend_coins,
    titleTemplate: "Big Spender",
    descriptionTemplate: "Spend {count} coins this month!",
    minTarget: 500,
    maxTarget: 1500,
    baseExpReward: 1200,
    baseCoinReward: 600,
    availableFor: ["monthly"],
  },
  {
    objective_type: QuestType.solve_challenge_no_hint,
    titleTemplate: "Pure Skill",
    descriptionTemplate: "Complete {count} challenges without hints!",
    minTarget: 15,
    maxTarget: 30,
    baseExpReward: 2200,
    baseCoinReward: 1100,
    availableFor: ["monthly"],
  },
  {
    objective_type: QuestType.defeat_enemy_full_hp,
    titleTemplate: "Flawless Champion",
    descriptionTemplate: "Win {count} battles without taking damage!",
    minTarget: 10,
    maxTarget: 20,
    baseExpReward: 2600,
    baseCoinReward: 1300,
    availableFor: ["monthly"],
  },
  {
    objective_type: QuestType.pvp_matches_total,
    titleTemplate: "PvP Challenger",
    descriptionTemplate: "Complete {count} PvP matches!",
    minTarget: 3,
    maxTarget: 8,
    baseExpReward: 75,
    baseCoinReward: 40,
    availableFor: ["daily", "weekly"],
  },
  {
    objective_type: QuestType.pvp_matches_with_friends,
    titleTemplate: "Play with Friends",
    descriptionTemplate:
      "Complete {count} PvP matches with your followers/following!",
    minTarget: 2,
    maxTarget: 5,
    baseExpReward: 100,
    baseCoinReward: 50,
    availableFor: ["daily", "weekly", "monthly"],
  },
  {
    objective_type: QuestType.pvp_victories,
    titleTemplate: "PvP Victor",
    descriptionTemplate: "Win {count} PvP matches!",
    minTarget: 2,
    maxTarget: 6,
    baseExpReward: 90,
    baseCoinReward: 45,
    availableFor: ["daily", "weekly", "monthly"],
  },
  {
    objective_type: QuestType.pvp_victories_with_friends,
    titleTemplate: "Legendary Friend",
    descriptionTemplate: "Win {count} PvP matches against your friends!",
    minTarget: 1,
    maxTarget: 4,
    baseExpReward: 120,
    baseCoinReward: 60,
    availableFor: ["weekly", "monthly"],
  },
  {
    objective_type: QuestType.pvp_perfect_matches,
    titleTemplate: "Flawless Fighter",
    descriptionTemplate: "Win {count} PvP matches without making any mistakes!",
    minTarget: 1,
    maxTarget: 3,
    baseExpReward: 150,
    baseCoinReward: 75,
    availableFor: ["weekly", "monthly"],
  },
];

const QUEST_CONCURRENCY_LIMIT = Math.max(
  1,
  Number.parseInt(process.env.QUEST_CONCURRENCY_LIMIT || "", 10) || 3,
);

function getQuestCount(period: QuestPeriod) {
  return period === "daily" ? 15 : period === "weekly" ? 10 : 7;
}

function getQuestBatchKey(period: QuestPeriod, startDate: Date) {
  return `${period}:${startDate.getTime()}`;
}

function buildQuestPool(period: QuestPeriod, batchKey: string, count?: number) {
  const questCount = count ?? getQuestCount(period);

  return generateQuestsByPeriod(period, questCount).map((quest) => ({
    ...quest,
    quest_batch_key: batchKey,
  }));
}

async function getOrCreateQuestPool(period: QuestPeriod) {
  const startDate = getStartDate(period);
  const batchKey = getQuestBatchKey(period, startDate);
  const questCount = getQuestCount(period);

  let existingQuests = await prisma.quest.findMany({
    where: {
      quest_period: period,
      quest_batch_key: batchKey,
    },
    orderBy: { quest_id: "asc" },
  });

  if (existingQuests.length < questCount) {
    const missingCount = questCount - existingQuests.length;

    await prisma.$transaction(async (tx) => {
      const questPoolData = buildQuestPool(period, batchKey, missingCount);

      for (const questData of questPoolData) {
        await tx.quest.create({
          data: questData,
        });
      }
    });

    existingQuests = await prisma.quest.findMany({
      where: {
        quest_period: period,
        quest_batch_key: batchKey,
      },
      orderBy: { quest_id: "asc" },
    });
  }

  return existingQuests.slice(0, questCount);
}

async function attachQuestPoolToPlayer(
  playerId: number,
  period: QuestPeriod,
  questPool: Array<{ quest_id: number }>,
) {
  const expirationDate = getExpirationDate(period);
  const startDate = getStartDate(period);

  await prisma.playerQuest.deleteMany({
    where: {
      player_id: playerId,
      quest_period: period,
      expires_at: { gte: startDate },
    },
  });

  await prisma.playerQuest.createMany({
    data: questPool.map((quest) => ({
      player_id: playerId,
      quest_id: quest.quest_id,
      current_value: 0,
      is_completed: false,
      is_claimed: false,
      expires_at: expirationDate,
      quest_period: period,
    })),
  });

  return await prisma.playerQuest.findMany({
    where: {
      player_id: playerId,
      quest_period: period,
      quest_id: { in: questPool.map((quest) => quest.quest_id) },
    },
    include: { quest: true },
    orderBy: { player_quest_id: "asc" },
  });
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
) {
  const executing = new Set<Promise<void>>();

  for (let i = 0; i < items.length; i += 1) {
    const task = worker(items[i], i);
    executing.add(task);

    const cleanup = () => executing.delete(task);
    task.then(cleanup).catch(cleanup);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
}

export function generateQuestsByPeriod(
  period: QuestPeriod,
  count: number,
): any[] {
  const availableTemplates = QUEST_TEMPLATES.filter((t) =>
    t.availableFor.includes(period),
  );

  const selected: QuestTemplate[] = [];
  for (let i = 0; i < count; i++) {
    const template =
      availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
    selected.push(template);
  }

  return selected.map((template) => {
    const targetValue =
      Math.floor(
        Math.random() * (template.maxTarget - template.minTarget + 1),
      ) + template.minTarget;

    let periodMultiplier = 1;
    if (period === "weekly") periodMultiplier = 1.2;
    if (period === "monthly") periodMultiplier = 1.5;

    const difficultyMultiplier = targetValue / template.minTarget;
    const rewardExp = Math.round(
      template.baseExpReward * difficultyMultiplier * periodMultiplier,
    );
    const rewardCoins = Math.round(
      template.baseCoinReward * difficultyMultiplier * periodMultiplier,
    );

    return {
      title: template.titleTemplate.replace("{count}", targetValue.toString()),
      description: template.descriptionTemplate.replace(
        "{count}",
        targetValue.toString(),
      ),
      objective_type: template.objective_type,
      target_value: targetValue,
      reward_exp: rewardExp,
      reward_coins: rewardCoins,
      quest_period: period,
    };
  });
}

export function getExpirationDate(period: QuestPeriod): Date {
  const now = new Date();
  const expiration = new Date(now);

  switch (period) {
    case "daily":
      expiration.setHours(23, 59, 59, 999);
      break;
    case "weekly":
      const daysUntilSunday = 7 - now.getDay();
      expiration.setDate(now.getDate() + daysUntilSunday);
      expiration.setHours(23, 59, 59, 999);
      break;
    case "monthly":
      expiration.setMonth(now.getMonth() + 1, 0);
      expiration.setHours(23, 59, 59, 999);
      break;
  }

  return expiration;
}

export function getStartDate(period: QuestPeriod): Date {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case "daily":
      start.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(now.getDate() - daysToMonday);
      start.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return start;
}

export async function generatePeriodicQuests(period: QuestPeriod) {
  console.log(`Starting ${period} quest generation for all players...`);

  const startTime = Date.now();

  try {
    const startDate = getStartDate(period);
    const expirationDate = getExpirationDate(period);
    const questPool = await getOrCreateQuestPool(period);

    const allPlayers = await prisma.player.findMany({
      select: { player_id: true, player_name: true },
    });

    console.log(`Found ${allPlayers.length} players to generate quests for`);

    let successCount = 0;
    let errorCount = 0;

    const batchSize = 50;
    for (let i = 0; i < allPlayers.length; i += batchSize) {
      const batch = allPlayers.slice(i, i + batchSize);

      await runWithConcurrency(
        batch,
        QUEST_CONCURRENCY_LIMIT,
        async (player) => {
          try {
            const existingQuests = await prisma.playerQuest.findMany({
              where: {
                player_id: player.player_id,
                quest_period: period,
                expires_at: { gte: startDate, lte: expirationDate },
              },
            });

            if (existingQuests.length > 0) {
              console.log(
                `Player ${player.player_name} already has ${period} quests`,
              );
              return;
            }

            await attachQuestPoolToPlayer(player.player_id, period, questPool);

            successCount++;
            console.log(`Generated ${period} quests for ${player.player_name}`);
          } catch (error) {
            errorCount++;
            console.error(`Failed for player ${player.player_id}:`, error);
          }
        },
      );
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`
      ${period.toUpperCase()} Quest Generation Complete!
      Success: ${successCount} players
      Errors: ${errorCount} players
      Duration: ${duration}s
    `);

    return {
      success: true,
      period,
      totalPlayers: allPlayers.length,
      successCount,
      errorCount,
      duration,
    };
  } catch (error) {
    console.error(`Fatal error during ${period} quest generation:`, error);
    throw error;
  }
}

export async function cleanupExpiredQuests(period?: QuestPeriod) {
  console.log(`Starting cleanup of expired ${period || "all"} quests...`);

  const now = new Date();

  try {
    const deletedPlayerQuests = await prisma.playerQuest.deleteMany({
      where: {
        expires_at: { lt: now },
        is_claimed: true,
        ...(period && { quest_period: period }),
      },
    });

    const orphanedQuests = await prisma.quest.findMany({
      where: {
        ...(period && { quest_period: period }),
        playerQuests: { none: {} },
      },
      select: { quest_id: true },
    });

    if (orphanedQuests.length > 0) {
      await prisma.quest.deleteMany({
        where: {
          quest_id: { in: orphanedQuests.map((q) => q.quest_id) },
        },
      });
    }

    console.log(`
      Cleanup Complete!
      Deleted ${deletedPlayerQuests.count} expired PlayerQuest entries
      Deleted ${orphanedQuests.length} orphaned Quest entries
    `);

    return {
      deletedPlayerQuests: deletedPlayerQuests.count,
      deletedOrphanedQuests: orphanedQuests.length,
    };
  } catch (error) {
    console.error("Error during cleanup:", error);
    throw error;
  }
}

export async function getPlayerQuestsByPeriod(
  playerId: number,
  period: QuestPeriod,
) {
  const startDate = getStartDate(period);
  const endDate = getExpirationDate(period);

  const quests = await prisma.playerQuest.findMany({
    where: {
      player_id: playerId,
      quest_period: period,
      expires_at: { gte: startDate, lte: endDate },
    },
    include: { quest: true },
    orderBy: { player_quest_id: "asc" },
  });

  return quests;
}

export async function forceGenerateQuestsForPlayer(
  playerId: number,
  period: QuestPeriod,
) {
  const questPool = await getOrCreateQuestPool(period);

  return await attachQuestPoolToPlayer(playerId, period, questPool);
}

export async function checkAndGenerateMissingQuests() {
  const periods: QuestPeriod[] = ["daily", "weekly", "monthly"];

  for (const period of periods) {
    try {
      const startDate = getStartDate(period);
      const endDate = getExpirationDate(period);

      const allPlayers = await prisma.player.findMany({
        select: { player_id: true, player_name: true },
      });

      const playersWithQuests = await prisma.playerQuest.groupBy({
        by: ["player_id"],
        where: {
          quest_period: period,
          expires_at: { gte: startDate, lte: endDate },
        },
      });

      const playersWithQuestsIds = new Set(
        playersWithQuests.map((p) => p.player_id),
      );

      const playersMissingQuests = allPlayers.filter(
        (p) => !playersWithQuestsIds.has(p.player_id),
      );

      if (playersMissingQuests.length > 0) {
        console.log(
          `Found ${playersMissingQuests.length} players missing ${period} quests`,
        );
        console.log(`Generating ${period} quests for missing players...`);

        let generatedCount = 0;
        const batchSize = 50;

        for (let i = 0; i < playersMissingQuests.length; i += batchSize) {
          const batch = playersMissingQuests.slice(i, i + batchSize);

          await runWithConcurrency(
            batch,
            QUEST_CONCURRENCY_LIMIT,
            async (player) => {
              try {
                await forceGenerateQuestsForPlayer(player.player_id, period);
                generatedCount++;
              } catch (error) {
                console.error(
                  `Failed to generate ${period} quests for player ${player.player_id}:`,
                  error,
                );
              }
            },
          );
        }

        console.log(`Generated ${period} quests for ${generatedCount} players`);
      } else {
        console.log(`All players have ${period} quests`);
      }
    } catch (error) {
      console.error(`Error checking ${period} quests:`, error);
    }
  }
}

export async function checkAndGenerateMissingQuestsForAllPlayers() {
  try {
    console.log("[Quest Service] Checking missing quests for all players...\n");

    const now = new Date();

    const allPlayers = await prisma.player.findMany({
      select: { player_id: true, player_name: true },
    });

    console.log(`[Quest Service] Found ${allPlayers.length} total players\n`);

    const results = {
      totalPlayers: allPlayers.length,
      playersProcessed: 0,
      playersWithMissingQuests: 0,
      questsGenerated: 0,
      errors: [] as Array<{ playerId: number; error: string }>,
    };

    // Process in batches of 50 to avoid blocking the event loop
    const batchSize = 50;
    for (let i = 0; i < allPlayers.length; i += batchSize) {
      const batch = allPlayers.slice(i, i + batchSize);
      const batchStart = i + 1;
      const batchEnd = Math.min(i + batchSize, allPlayers.length);

      console.log(
        `[Quest Service] Processing batch ${batchStart}-${batchEnd}/${allPlayers.length}`,
      );

      // Process entire batch in parallel
      await runWithConcurrency(
        batch,
        QUEST_CONCURRENCY_LIMIT,
        async (player) => {
          try {
            let generatedForThisPlayer = 0;

            // Fetch all quest periods for this player in ONE query
            const playerQuestPeriods = await prisma.playerQuest.findMany({
              where: {
                player_id: player.player_id,
                expires_at: { gte: now },
              },
              select: { quest_period: true },
              distinct: ["quest_period"],
            });

            const hasPeriods = {
              daily: playerQuestPeriods.some((q) => q.quest_period === "daily"),
              weekly: playerQuestPeriods.some(
                (q) => q.quest_period === "weekly",
              ),
              monthly: playerQuestPeriods.some(
                (q) => q.quest_period === "monthly",
              ),
            };

            if (!hasPeriods.daily) {
              await forceGenerateQuestsForPlayer(player.player_id, "daily");
              generatedForThisPlayer++;
            }

            if (!hasPeriods.weekly) {
              await forceGenerateQuestsForPlayer(player.player_id, "weekly");
              generatedForThisPlayer++;
            }

            if (!hasPeriods.monthly) {
              await forceGenerateQuestsForPlayer(player.player_id, "monthly");
              generatedForThisPlayer++;
            }

            if (generatedForThisPlayer > 0) {
              results.playersWithMissingQuests++;
              results.questsGenerated += generatedForThisPlayer;
            }

            results.playersProcessed++;
          } catch (error: any) {
            console.error(
              `[Quest Service] Error for player ${player.player_id}: ${error.message}`,
            );
            results.errors.push({
              playerId: player.player_id,
              error: error.message,
            });
          }
        },
      );

      // Yield to event loop between batches
      await new Promise((resolve) => setImmediate(resolve));
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[Quest Service] Missing quests check COMPLETED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Total Players: ${results.totalPlayers}`);
    console.log(`Players Processed: ${results.playersProcessed}`);
    console.log(
      `Players with Missing Quests: ${results.playersWithMissingQuests}`,
    );
    console.log(`Total Quests Generated: ${results.questsGenerated}`);
    console.log(`Errors: ${results.errors.length}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return results;
  } catch (error) {
    console.error(
      "[Quest Service] CRITICAL ERROR in checkAndGenerateMissingQuestsForAllPlayers:",
      error,
    );
    throw error;
  }
}

export async function cleanupExpiredQuestsForAllPlayers() {
  try {
    console.log("[Quest Service] Starting cleanup of expired quests...\n");

    const now = new Date();

    const expiredQuests = await prisma.playerQuest.findMany({
      where: {
        expires_at: { lt: now },
        is_claimed: true,
      },
      select: { player_quest_id: true, player_id: true, quest_id: true },
    });

    console.log(
      `[Quest Service] Found ${expiredQuests.length} expired quests to delete`,
    );

    const results = {
      totalDeletedQuests: 0,
      totalRegenerated: 0,
      affectedPlayers: new Set<number>(),
      errors: [] as Array<{ playerId: number; error: string }>,
    };

    if (expiredQuests.length > 0) {
      await prisma.playerQuest.deleteMany({
        where: {
          player_quest_id: {
            in: expiredQuests.map((q) => q.player_quest_id),
          },
        },
      });

      const orphanedQuests = await prisma.quest.findMany({
        where: { playerQuests: { none: {} } },
        select: { quest_id: true },
      });

      if (orphanedQuests.length > 0) {
        await prisma.quest.deleteMany({
          where: {
            quest_id: { in: orphanedQuests.map((q) => q.quest_id) },
          },
        });
        console.log(
          `[Quest Service] ✅ Also deleted ${orphanedQuests.length} orphaned Quests`,
        );
      }

      results.totalDeletedQuests = expiredQuests.length;
      expiredQuests.forEach((q) => {
        results.affectedPlayers.add(q.player_id);
      });

      console.log(
        `[Quest Service] ✅ Deleted ${expiredQuests.length} expired quests\n`,
      );
    }

    console.log(`[Quest Service] Checking for missing active quests...\n`);

    const allPlayers = await prisma.player.findMany({
      select: { player_id: true },
    });

    let playerWithMissingCount = 0;

    // Process players in batches to avoid blocking
    const batchSize = 50;
    for (let i = 0; i < allPlayers.length; i += batchSize) {
      const batch = allPlayers.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (player) => {
          try {
            // Get all active quest periods for this player in ONE query
            const activeQuests = await prisma.playerQuest.findMany({
              where: {
                player_id: player.player_id,
                expires_at: { gt: now },
              },
              select: { quest: { select: { quest_period: true } } },
            });

            const activePeriods = new Set(
              activeQuests.map((q) => q.quest.quest_period),
            );

            let regeneratedForPlayer = 0;

            if (!activePeriods.has("daily")) {
              await forceGenerateQuestsForPlayer(player.player_id, "daily");
              regeneratedForPlayer++;
            }

            if (!activePeriods.has("weekly")) {
              await forceGenerateQuestsForPlayer(player.player_id, "weekly");
              regeneratedForPlayer++;
            }

            if (!activePeriods.has("monthly")) {
              await forceGenerateQuestsForPlayer(player.player_id, "monthly");
              regeneratedForPlayer++;
            }

            if (regeneratedForPlayer > 0) {
              results.totalRegenerated += regeneratedForPlayer;
              results.affectedPlayers.add(player.player_id);
              playerWithMissingCount++;
            }
          } catch (error: any) {
            results.errors.push({
              playerId: player.player_id,
              error: error.message,
            });
          }
        }),
      );

      // Yield to event loop between batches
      await new Promise((resolve) => setImmediate(resolve));
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[Quest Service] Cleanup COMPLETED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Deleted Expired Quests: ${results.totalDeletedQuests}`);
    console.log(`Players with Missing Quests: ${playerWithMissingCount}`);
    console.log(`Quests Regenerated: ${results.totalRegenerated}`);
    console.log(`Total Affected Players: ${results.affectedPlayers.size}`);
    console.log(`Errors: ${results.errors.length}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return {
      deletedExpiredQuests: results.totalDeletedQuests,
      regeneratedQuests: results.totalRegenerated,
      affectedPlayers: results.affectedPlayers.size,
    };
  } catch (error) {
    console.error("[Quest Service] CRITICAL ERROR in cleanup:", error);
    throw error;
  }
}
