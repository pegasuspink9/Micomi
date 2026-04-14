import dotenv from "dotenv";
import { ensureDailyPvpChallenges } from "../src/game/PvP/pvpChallengeGenerator.service";

dotenv.config();

const run = async () => {
  try {
    const result = await ensureDailyPvpChallenges({
      perTopicTarget: 10, // Good daily number without timing out server completely
      difficulty: "Easy",
    });

    console.log("Seeded/verified today's PvP challenge pool:", result);
    process.exit(0);
  } catch (error) {
    console.error("Failed seeding today's PvP challenge pool:", error);
    process.exit(1);
  }
};

void run();
