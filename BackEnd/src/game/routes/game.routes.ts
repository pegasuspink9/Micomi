import express from "express";
import * as CombatController from "../Combat/combat.controller";
import * as ChallengeController from "../Challenges/challenges.controller";
import * as ShopController from "../Shop/shop.controller";
import * as AchievementController from "../Achievements/achievements.controller";
import * as LevelController from "../Levels/levels.controller";
import * as MapController from "../Maps/maps.controller";
import * as CharacterController from "../Characters/characters.controller";
import * as LeaderboardController from "../Leaderboard/leaderboard.controller";
import {
  authenticate,
  requirePlayer,
} from "../../../middleware/auth.middleware";

const router = express.Router();

//Level routes
router.post(
  "/entryLevel",
  authenticate,
  requirePlayer,
  LevelController.enterLevelController
);
router.post(
  "/unlockNewLevel",
  authenticate,
  requirePlayer,
  LevelController.unlockNextLevel
);

//Map route
router.post(
  "/select-map",
  authenticate,
  requirePlayer,
  MapController.selectMap
);

//Character route
router.post(
  "selected-character/:playerId",
  authenticate,
  requirePlayer,
  CharacterController.selectCharacter
);

//Combat route
router.post(
  "/fight",
  authenticate,
  requirePlayer,
  CombatController.performFight
);

//Shop routes
router.post(
  "/buy-potion",
  authenticate,
  requirePlayer,
  ShopController.buyPotion
);
router.post(
  "/buy-character",
  authenticate,
  requirePlayer,
  ShopController.buyCharacter
);
router.post(
  "/use-potion",
  authenticate,
  requirePlayer,
  ShopController.usePotion
);

//Achievement routes
router.post(
  "/check-achievements",
  authenticate,
  requirePlayer,
  AchievementController.getPlayerAchievements
);
router.get(
  "/player-achievement/:id",
  AchievementController.getPlayerAchievements
);

//Leaderboard routes
router.get("/leaderboard", LeaderboardController.getLeaderboard);
router.post("/update-leaderboard", LeaderboardController.updateLeaderboard);

//Challenge route
router.post(
  "/submit-challenge",
  authenticate,
  requirePlayer,
  ChallengeController.submitChallenge
);

export default router;
