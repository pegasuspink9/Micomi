import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
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
import levelPotionShopRoutes from "./models/Potion Shop by Level/levelPotionShop.routes";
import authRoutes from "../middleware/auth.routes";
import { getAllPlayerProgress } from "../src/models/Player/playerProgress.service";

import { Server } from "socket.io";
import http from "http";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cookieParser());

const cors = require("cors");
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

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
app.use("/level-potion-shop", levelPotionShopRoutes);
app.use("/game", gameRoutes);

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

export { io, server };

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
