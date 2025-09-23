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
import authRoutes from "../middleware/auth.routes";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cookieParser());

const cors = require("cors");
app.use(
  cors({
    origin: [
      "http://192.168.254.118:3000", 
      "http://192.168.254.118:8082", 
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
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

app.use("/game", gameRoutes);

app.listen(3000, () => {
  console.log(`Server running on http://localhost:3000`);
});