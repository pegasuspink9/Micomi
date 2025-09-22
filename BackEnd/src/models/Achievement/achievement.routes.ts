import express from "express";
import * as AchievementService from "./achievement.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", AchievementService.getAllAchievement);
router.get("/:id", AchievementService.getAchievementById);
router.post("/", AchievementService.createAchievement);
router.put("/:id", AchievementService.updateAchievement);
router.delete("/:id", AchievementService.deleteAchievement);

export default router;
