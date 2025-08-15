import express from "express";
import * as AchievementController from "./achievement.controller";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", authenticate, AchievementController.getAllAchievement);
router.get("/:id", authenticate, AchievementController.getAchievementById);
router.post(
  "/",
  authenticate,
  requireAdmin,
  AchievementController.createAchievement
);
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  AchievementController.updateAchievement
);
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  AchievementController.deleteAchievement
);

export default router;
