import { Router } from "express";
import * as QuestService from "./quest.service";
import * as QuestsController from "../../game/Quests/quests.controller";

const router = Router();
router.get("/", QuestService.getAllQuests);
router.get("/:id", QuestService.getQuestById);
router.post("/", QuestService.createQuest);
router.put("/:id", QuestService.updateQuest);
router.delete("/:id", QuestService.deleteQuest);

// Player quest routes
router.get("/player/:playerId", QuestService.getPlayerQuest);

router.get(
  "/player/:playerId/quests",
  QuestService.getPlayerQuestsByPeriodController
);

router.get(
  "/player/:playerId/daily",
  QuestService.getPlayerDailyQuestsController
);

// Player claim quest
router.post(
  "/:playerId/:questId/claim",
  QuestsController.claimQuestRewardController
);

router.post("/admin/generate", QuestService.adminGeneratePeriodicQuests);

router.post("/admin/generate-daily", QuestService.adminGenerateDailyQuests);

router.post("/admin/cleanup-expired", QuestService.adminCleanupExpiredQuests);

router.post(
  "/admin/player/:playerId/refresh",
  QuestService.adminForceRefreshPlayerQuests
);

router.get("/admin/stats", QuestService.adminGetQuestStats);

router.get("/admin/stats/daily", QuestService.adminGetDailyQuestStats);

export default router;
