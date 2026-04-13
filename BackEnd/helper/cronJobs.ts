import cron from "node-cron";
import {
  generatePeriodicQuests,
  cleanupExpiredQuests,
} from "../src/models/Quest/periodicQuests.service";
import { QuestPeriod } from "@prisma/client";
import { ensureDailyPvpChallenges } from "../src/game/PvP/pvpChallengeGenerator.service";

export function setupCronJobs() {
  cron.schedule("0 0 * * *", async () => {
    console.log("\n" + "=".repeat(60));
    console.log("DAILY PVP CHALLENGE RESET - Starting");
    console.log("=".repeat(60));

    try {
      const result = await ensureDailyPvpChallenges({
        perTopicTarget: 12,
        difficulty: "Easy",
        forceResetToday: true,
      });

      console.log("Daily PvP challenge reset completed:", result);
      console.log("=".repeat(60) + "\n");
    } catch (error) {
      console.error("DAILY PVP CHALLENGE RESET - Failed:", error);
    }
  });

  cron.schedule("*/15 * * * *", async () => {
    try {
      const result = await ensureDailyPvpChallenges({
        perTopicTarget: 12,
        difficulty: "Easy",
      });
      console.log("[PVP Cron] Pool refill check completed:", result);
    } catch (error) {
      console.error("[PVP Cron] Pool refill check failed:", error);
    }
  });

  cron.schedule("1 0 * * *", async () => {
    console.log("\n" + "=".repeat(60));
    console.log("DAILY QUEST GENERATION - Starting");
    console.log("=".repeat(60));

    try {
      console.log("\nStep 1: Cleaning up expired daily quests...");
      await cleanupExpiredQuests("daily" as QuestPeriod);

      console.log("\nStep 2: Generating new daily quests...");
      await generatePeriodicQuests("daily" as QuestPeriod);

      console.log("\n" + "=".repeat(60));
      console.log("DAILY QUEST GENERATION - Completed Successfully");
      console.log("=".repeat(60) + "\n");
    } catch (error) {
      console.error("DAILY QUEST GENERATION - Failed:", error);
    }
  });

  cron.schedule("5 0 * * 1", async () => {
    console.log("\n" + "=".repeat(60));
    console.log("WEEKLY QUEST GENERATION - Starting");
    console.log("=".repeat(60));

    try {
      console.log("\nStep 1: Cleaning up expired weekly quests...");
      await cleanupExpiredQuests("weekly" as QuestPeriod);

      console.log("\nStep 2: Generating new weekly quests...");
      await generatePeriodicQuests("weekly" as QuestPeriod);

      console.log("\n" + "=".repeat(60));
      console.log("WEEKLY QUEST GENERATION - Completed Successfully");
      console.log("=".repeat(60) + "\n");
    } catch (error) {
      console.error("WEEKLY QUEST GENERATION - Failed:", error);
    }
  });

  cron.schedule("10 0 1 * *", async () => {
    console.log("\n" + "=".repeat(60));
    console.log("MONTHLY QUEST GENERATION - Starting");
    console.log("=".repeat(60));

    try {
      console.log("\nStep 1: Cleaning up expired monthly quests...");
      await cleanupExpiredQuests("monthly" as QuestPeriod);

      console.log("\nStep 2: Generating new monthly quests...");
      await generatePeriodicQuests("monthly" as QuestPeriod);

      console.log("\n" + "=".repeat(60));
      console.log("MONTHLY QUEST GENERATION - Completed Successfully");
      console.log("=".repeat(60) + "\n");
    } catch (error) {
      console.error("MONTHLY QUEST GENERATION - Failed:", error);
    }
  });

  cron.schedule("0 3 * * *", async () => {
    console.log("\nRunning additional cleanup at 3 AM...");
    try {
      await cleanupExpiredQuests();
      console.log("Additional cleanup completed\n");
    } catch (error) {
      console.error("Additional cleanup failed:", error);
    }
  });
}
