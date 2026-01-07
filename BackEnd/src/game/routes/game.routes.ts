import express from "express";
import * as ChallengeController from "../Challenges/challenges.controller";
import * as ShopController from "../Shop/shop.controller";
import * as AchievementController from "../Achievements/achievements.controller";
import * as LevelController from "../Levels/levels.controller";
import * as MapController from "../Maps/maps.controller";
import * as LeaderboardController from "../Leaderboard/leaderboard.controller";
import * as ModelShopService from "../../models/Shop/shop.service";
import * as LessonsController from "../Lessons/lesson.controller";
import {
  authenticate,
  requirePlayer,
} from "../../../middleware/auth.middleware";

const router = express.Router();

//Level routes
router.get(
  "/entryLevel/:levelId/preview",
  authenticate,
  requirePlayer,
  LevelController.previewLevelController
);
router.post(
  "/entryLevel/:levelId",
  authenticate,
  requirePlayer,
  LevelController.enterLevelController
);
router.post(
  "/lesson/:levelId/:lessonId/next",
  authenticate,
  requirePlayer,
  LessonsController.getNextLesson //next page
);
router.post(
  "/lesson/:levelId/:lessonId/previous",
  authenticate,
  requirePlayer,
  LessonsController.getPreviousLesson //previous page
);

//Challenge route
router.post(
  "/submit-challenge/:levelId/:challengeId",
  authenticate,
  requirePlayer,
  ChallengeController.submitChallenge
);

//Shop routes
router.get(
  "/player-characters",
  authenticate,
  requirePlayer,
  ModelShopService.getAllPlayerCharacter
);
router.post(
  "/buy-character/:characterShopId",
  authenticate,
  requirePlayer,
  ShopController.buyCharacter
);
router.get(
  "/potion",
  authenticate,
  requirePlayer,
  ModelShopService.getAllPlayerPotions
);
router.post(
  "/submit-challenge/:levelId/:challengeId/use-potion",
  authenticate,
  requirePlayer,
  ShopController.usePotion
);

//Achievement routes
router.post("/check-achievements", AchievementController.getPlayerAchievements);
router.get(
  "/player-achievement",
  authenticate,
  requirePlayer,
  AchievementController.getPlayerAchievements
);
router.post(
  "/select-badge/:achievementId",
  authenticate,
  requirePlayer,
  AchievementController.selectBadge
); //badge selection

//Leaderboard routes
router.get(
  "/leaderboard",
  authenticate,
  requirePlayer,
  LeaderboardController.getLeaderboard
);
router.get(
  "/player-rank",
  authenticate,
  requirePlayer,
  LeaderboardController.getPlayerRank
);

export default router;
