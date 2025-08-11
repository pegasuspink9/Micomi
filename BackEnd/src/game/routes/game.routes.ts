import express from "express";
import * as CombatController from "../Combat/combat.controller";
import * as ChallengeController from "../Challenges/challenges.controller";
import * as ShopController from "../Shop/shop.controller";
import * as AchievementController from "../Achievements/achievements.controller";
import * as LevelController from "../Levels/levels.controller";
import * as MapController from "../Maps/maps.controller";
import * as CharacterController from "../Characters/characters.controller";

const router = express.Router();

//Level routes
router.post("/entryLevel", LevelController.enterLevelController);
router.post("/unlockNewLevel", LevelController.unlockNextLevel);

//Map route
router.post("/select-map", MapController.selectMap);

//Character route
router.post(
  "selected-character/:playerId",
  CharacterController.getSelectedCharacter
);

//Combat route
router.post("/fight", CombatController.performFight);

//Shop routes
router.post("/buy-item", ShopController.buyItem);
router.post("/use-potion", ShopController.usePotion);

//Achievement routes
router.post("/check-achievements", AchievementController.checkAchievements);
router.get(
  "/player-achievemnt/:id",
  AchievementController.getPlayerAchievements
);

//Leaderboard routes
router.get("/leaderboard", AchievementController.getLeaderboard);
router.post("/update-leaderboard", AchievementController.updateLeaderboard);

//Challenge route
router.post("/submit-challenge", ChallengeController.submitChallenge);

export default router;
