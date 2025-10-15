import express from "express";
import * as CombatController from "../Combat/combat.controller";
import * as ChallengeController from "../Challenges/challenges.controller";
import * as ShopController from "../Shop/shop.controller";
import * as AchievementController from "../Achievements/achievements.controller";
import * as LevelController from "../Levels/levels.controller";
import * as MapController from "../Maps/maps.controller";
import * as LeaderboardController from "../Leaderboard/leaderboard.controller";
import * as ModelShopService from "../../models/Shop/shop.service";
import {
  authenticate,
  requirePlayer,
} from "../../../middleware/auth.middleware";

const router = express.Router();

//Map route
router.post("/select-map/:playerId/:mapId", MapController.selectMap);

//Level routes
router.get(
  "/entryLevel/:playerId/:levelId/preview",
  LevelController.previewLevelController
);
router.post(
  //shop buy potion in level
  "/entryLevel/:playerId/:levelId/preview/buy-potion/:potionId",
  ShopController.buyPotion
);
router.post(
  "/entryLevel/:playerId/:levelId",
  LevelController.enterLevelController
);
router.post(
  "/entryLevel/:playerId/:levelId/preview/micomi-done", //for micomi level
  LevelController.completeMicomiLevel
);
router.post(
  "/entryLevel/:playerId/:levelId/preview/shop-done", //for potion shop level
  LevelController.completeShopLevel
);

//Challenge route
router.post(
  "/submit-challenge/:playerId/:levelId/:challengeId",
  ChallengeController.submitChallenge
);

//Shop routes
router.get(
  "/player-characters/:playerId",
  ModelShopService.getAllPlayerCharacter
);
router.post("/buy-character/:playerId", ShopController.buyCharacter);
router.get("/potion/:playerId", ModelShopService.getAllPlayerPotions);
router.post(
  "/submit-challenge/:playerId/:levelId/:challengeId/use-potion",
  ShopController.usePotion
);

//Combat route
router.post("/fight", CombatController.performFight);

//Achievement routes
router.post("/check-achievements", AchievementController.getPlayerAchievements);
router.get(
  "/player-achievement/:playerId",
  AchievementController.getPlayerAchievements
);

//Leaderboard routes
router.get("/leaderboard", LeaderboardController.getLeaderboard);
router.get("/player-rank/:id", LeaderboardController.getPlayerRank);

export default router;
