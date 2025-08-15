import express from "express";
import * as PlayerAchievementController from "./playerAchievement.controller";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get(
  "/",
  authenticate,
  PlayerAchievementController.getAllPlayerAchievement
);
router.get("/:id", authenticate, PlayerAchievementController.updateAchievement);
router.post(
  "/",
  authenticate,
  requireAdmin,
  PlayerAchievementController.createPlayerAchievement
);
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  PlayerAchievementController.updateAchievement
);
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  PlayerAchievementController.deleteAchievement
);

export default router;
