import express from "express";
import * as AchievementController from "./achievement.controller";

const router = express.Router();

router.get("/", AchievementController.getAllAchievement);
router.get("/:id", AchievementController.getAchievementById);
router.post("/", AchievementController.createAchievement);
router.put("/:id", AchievementController.updateAchievement);
router.delete("/:id", AchievementController.deleteAchievement);

export default router;
