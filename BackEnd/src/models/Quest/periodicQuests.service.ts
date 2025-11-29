import { QuestType, QuestPeriod, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    minTarget: 20,
    maxTarget: 50,
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
    minTarget: 2,
    maxTarget: 5,
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
    minTarget: 100,
    maxTarget: 200,
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
    minTarget: 10,
    maxTarget: 20,
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
];

export function generateQuestsByPeriod(
  period: QuestPeriod,
  count: number
): any[] {
  const availableTemplates = QUEST_TEMPLATES.filter((t) =>
    t.availableFor.includes(period)
  );

  const shuffled = [...availableTemplates].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map((template) => {
    const targetValue =
      Math.floor(
        Math.random() * (template.maxTarget - template.minTarget + 1)
      ) + template.minTarget;

    let periodMultiplier = 1;
    if (period === "weekly") periodMultiplier = 1.2;
    if (period === "monthly") periodMultiplier = 1.5;

    const difficultyMultiplier = targetValue / template.minTarget;
    const rewardExp = Math.round(
      template.baseExpReward * difficultyMultiplier * periodMultiplier
    );
    const rewardCoins = Math.round(
      template.baseCoinReward * difficultyMultiplier * periodMultiplier
    );

    return {
      title: template.titleTemplate.replace("{count}", targetValue.toString()),
      description: template.descriptionTemplate.replace(
        "{count}",
        targetValue.toString()
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
  const expirationDate = getExpirationDate(period);
  const startDate = getStartDate(period);

  const questCount = period === "daily" ? 3 : period === "weekly" ? 4 : 5;

  try {
    const allPlayers = await prisma.player.findMany({
      select: { player_id: true, player_name: true },
    });

    console.log(`Found ${allPlayers.length} players to generate quests for`);

    let successCount = 0;
    let errorCount = 0;

    const batchSize = 50;
    for (let i = 0; i < allPlayers.length; i += batchSize) {
      const batch = allPlayers.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (player) => {
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
                `Player ${player.player_name} already has ${period} quests`
              );
              return;
            }

            const questsData = generateQuestsByPeriod(period, questCount);

            await prisma.$transaction(async (tx) => {
              for (const questData of questsData) {
                const quest = await tx.quest.create({
                  data: questData,
                });

                await tx.playerQuest.create({
                  data: {
                    player_id: player.player_id,
                    quest_id: quest.quest_id,
                    current_value: 0,
                    is_completed: false,
                    is_claimed: false,
                    expires_at: expirationDate,
                    quest_period: period,
                  },
                });
              }
            });

            successCount++;
            console.log(`Generated ${period} quests for ${player.player_name}`);
          } catch (error) {
            errorCount++;
            console.error(`Failed for player ${player.player_id}:`, error);
          }
        })
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
  period: QuestPeriod
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
  period: QuestPeriod
) {
  const expirationDate = getExpirationDate(period);
  const startDate = getStartDate(period);
  const questCount = period === "daily" ? 3 : period === "weekly" ? 4 : 5;

  await prisma.playerQuest.deleteMany({
    where: {
      player_id: playerId,
      quest_period: period,
      expires_at: { gte: startDate },
    },
  });

  const questsData = generateQuestsByPeriod(period, questCount);

  return await prisma.$transaction(async (tx) => {
    const createdQuests = [];

    for (const questData of questsData) {
      const quest = await tx.quest.create({
        data: questData,
      });

      const playerQuest = await tx.playerQuest.create({
        data: {
          player_id: playerId,
          quest_id: quest.quest_id,
          current_value: 0,
          is_completed: false,
          is_claimed: false,
          expires_at: expirationDate,
          quest_period: period,
        },
        include: { quest: true },
      });

      createdQuests.push(playerQuest);
    }

    return createdQuests;
  });
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
        playersWithQuests.map((p) => p.player_id)
      );

      const playersMissingQuests = allPlayers.filter(
        (p) => !playersWithQuestsIds.has(p.player_id)
      );

      if (playersMissingQuests.length > 0) {
        console.log(
          `Found ${playersMissingQuests.length} players missing ${period} quests`
        );
        console.log(`Generating ${period} quests for missing players...`);

        let generatedCount = 0;
        const batchSize = 50;

        for (let i = 0; i < playersMissingQuests.length; i += batchSize) {
          const batch = playersMissingQuests.slice(i, i + batchSize);

          await Promise.all(
            batch.map(async (player) => {
              try {
                await forceGenerateQuestsForPlayer(player.player_id, period);
                generatedCount++;
              } catch (error) {
                console.error(
                  `Failed to generate ${period} quests for player ${player.player_id}:`,
                  error
                );
              }
            })
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
