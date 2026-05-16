import express from "express";
import * as PlayerAchievementService from "./playerAchievement.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get(
  "/",
  authenticate,
  requireAdmin,
  PlayerAchievementService.getAllPlayerAchievement,
);
router.get(
  "/:id",
  authenticate,
  requireAdmin,
  PlayerAchievementService.getPlayerAchievementById,
);
router.post(
  "/",
  authenticate,
  requireAdmin,
  PlayerAchievementService.createPlayerAchievement,
);
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  PlayerAchievementService.updatePlayerAchievement,
);
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  PlayerAchievementService.deletePlayerAchievement,
);

export default router;
