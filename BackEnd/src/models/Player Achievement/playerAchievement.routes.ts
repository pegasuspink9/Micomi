import express from "express";
import * as PlayerAchievementService from "./playerAchievement.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", PlayerAchievementService.getAllPlayerAchievement);
router.get("/:id", PlayerAchievementService.getPlayerAchievementById);
router.post("/", PlayerAchievementService.createPlayerAchievement);
router.put("/:id", PlayerAchievementService.updatePlayerAchievement);
router.delete("/:id", PlayerAchievementService.deletePlayerAchievement);

export default router;
