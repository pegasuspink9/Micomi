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

//Map route
router.post("/select-map/:playerId/:mapId", MapController.selectMap);

//Character route
router.post(
  "/select-character/:playerId/:characterId",
  CharacterController.selectCharacter
);

//Level routes
router.post(
  "/entryLevel/:playerId/:levelId",
  LevelController.enterLevelController
);
router.post("/unlockNewLevel", LevelController.unlockNextLevel);

//Challenge route
router.post(
  "/submit-challenge/:playerId/:levelId/:challengeId",
  ChallengeController.submitChallenge
);

//Shop routes
router.post("/buy-character/:playerId", ShopController.buyCharacter);
router.post("/buy-potion/:playerId", ShopController.buyPotion);
router.post("/use-potion", ShopController.usePotion);

//Combat route
router.post("/fight", CombatController.performFight);

//Achievement routes
router.post("/check-achievements", AchievementController.getPlayerAchievements);
router.get(
  "/player-achievement/:id",
  AchievementController.getPlayerAchievements
);

//Leaderboard routes
router.get("/leaderboard", LeaderboardController.getLeaderboard);
router.get("/player-rank/:id", LeaderboardController.getPlayerRank);

export default router;
