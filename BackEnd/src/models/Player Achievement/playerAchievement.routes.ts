import express from "express";
import * as PlayerAchievementController from "./playerAchievement.controller";

const router = express.Router();

router.get("/", PlayerAchievementController.getAllPlayerAchievement);
router.get("/:id", PlayerAchievementController.updateAchievement);
router.post("/", PlayerAchievementController.createPlayerAchievement);
router.put("/:id", PlayerAchievementController.updateAchievement);
router.delete("/:id", PlayerAchievementController.deleteAchievement);

export default router;
