import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";

import { setupCronJobs } from "../helper/cronJobs";
import {
  ensureDailyPvpChallenges,
  generateBatchedPvpChallenges,
} from "./game/PvP/pvpChallengeGenerator.service";
import {
  checkAndGenerateMissingQuestsForAllPlayers,
  cleanupExpiredQuestsForAllPlayers,
} from "./models/Quest/periodicQuests.service";

import adminRoutes from "./models/Admin/admin.routes";
import playerRoutes from "./models/Player/player.routes";
import mapRoutes from "./models/Map/map.routes";
import levelRoutes from "./models/Level/level.routes";
import challengeRoutes from "./models/Challenge/challenge.routes";
import enemyRoutes from "./models/Enemy/enemy.routes";
import characterRoutes from "./models/Character/character.routes";
import achievementRoutes from "./models/Achievement/achievement.routes";
import playerAchievementRoutes from "./models/Player Achievement/playerAchievement.routes";
import shopRoutes from "./models/Shop/shop.routes";
import gameRoutes from "./game/routes/game.routes";
import lessonRoutes from "./models/Lesson/lesson.routes";
import questRoutes from "./models/Quest/quest.routes";
import dialogueRoutes from "./models/Dialogue/dialogue.routes";
import authRoutes from "../middleware/auth.routes";
import { getAllPlayerProgress } from "../src/models/Player/playerProgress.service";
import avatarRoutes from "./models/Avatar/avatar.routes";
import moduleRoutes from "./models/Module/module.routes";
import socialRoutes from "./models/Social/social.routes";

import testRoutes from "../middleware/testing.toutes";

import { Server } from "socket.io";
import http from "http";
import { setSocketServer } from "./socket";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
setSocketServer(io);

const prisma = new PrismaClient();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const cors = require("cors");
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use("/test/auth", testRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/player", playerRoutes);
app.use("/map", mapRoutes);
app.use("/level", levelRoutes);
app.use("/challenge", challengeRoutes);
app.use("/enemy", enemyRoutes);
app.use("/character", characterRoutes);
app.use("/achievement", achievementRoutes);
app.use("/playerAchievement", playerAchievementRoutes);
app.use("/shop", shopRoutes);
app.use("/lesson", lessonRoutes);
app.use("/quest", questRoutes);
app.use("/dialogue", dialogueRoutes);
app.use("/game", gameRoutes);
app.use("/avatar", avatarRoutes);
app.use("/module", moduleRoutes);
app.use("/social", socialRoutes);

//temporary
app.get("/progress", getAllPlayerProgress);

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("joinRoom", (playerId: number) => {
    socket.join(playerId.toString());
    console.log(`Player ${playerId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`\n✅ Server running on port ${PORT}\n`);

  setTimeout(async () => {
    try {
      console.log(
        "[⏳ Quest Service] Initializing quests for existing players...",
      );
      await checkAndGenerateMissingQuestsForAllPlayers();
      console.log("[✅ Quest Service] Quest initialization complete\n");

      console.log("[⏳ PvP Service] Ensuring today's PvP challenge pool...");
      const pvpSeedResult = await ensureDailyPvpChallenges({
        perTopicTarget: 12,
        difficulty: "Easy",
      });
      console.log(
        "[✅ PvP Service] Today's PvP pool ready:",
        pvpSeedResult,
        "\n",
      );

      console.log(
        "[⏳ Quest Service] Running initial cleanup of expired quests...",
      );
      await cleanupExpiredQuestsForAllPlayers();
      console.log("[✅ Quest Service] Initial cleanup complete\n");

      setInterval(
        async () => {
          console.log("[⏳ PvP Service] Running scheduled batch generation...");
          const categories: ("HTML" | "CSS" | "JavaScript" | "Computer")[] = [
            "HTML",
            "CSS",
            "JavaScript",
            "Computer",
          ];
          const TARGET_POOL = 50;

          for (const category of categories) {
            try {
              const currentCount = await prisma.pVPChallenge.count({
                where: { topic: category, difficulty: "Easy" },
              });

              if (currentCount < TARGET_POOL) {
                const batchesNeeded = Math.ceil(
                  (TARGET_POOL - currentCount) / 5,
                );
                console.log(
                  `[PvP Service] Need ~${batchesNeeded * 5} more challenges for ${category}. Generating...`,
                );

                for (let i = 0; i < batchesNeeded; i++) {
                  await generateBatchedPvpChallenges(category, "Easy", 5);
                  await new Promise((res) => setTimeout(res, 5000));
                }
              }
            } catch (error) {
              console.error(
                `[❌ PvP Service] Error generating batch for ${category}:`,
                error,
              );
            }
          }
          console.log(
            "[✅ PvP Service] Scheduled batch generation complete.\n",
          );
        },
        4 * 60 * 60 * 1000,
      );

      console.log(
        "[✅ PvP Service] Scheduled background generator registered (every 4 hours)\n",
      );

      console.log(
        "[✅ Quest Service] Scheduled cleanup registered (every 6 hours)\n",
      );

      try {
        setupCronJobs();
        console.log("[✅ Cron Jobs] Cron jobs initialized\n");
      } catch (error) {
        console.error("[⚠️ Cron Jobs] Error setting up cron jobs:", error);
      }
    } catch (error) {
      console.error(
        "[❌ Quest Service] Critical error during initialization:",
        error,
      );
    }
  }, 2000);
});

export { io, server };
