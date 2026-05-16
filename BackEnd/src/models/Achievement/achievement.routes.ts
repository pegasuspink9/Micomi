import express from "express";
import * as AchievementService from "./achievement.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get(
  "/",
  authenticate,
  requireAdmin,
  AchievementService.getAllAchievement,
);
router.get(
  "/:id",
  authenticate,
  requireAdmin,
  AchievementService.getAchievementById,
);
router.post(
  "/",
  authenticate,
  requireAdmin,
  AchievementService.createAchievement,
);
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  AchievementService.updateAchievement,
);
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  AchievementService.deleteAchievement,
);

export default router;
