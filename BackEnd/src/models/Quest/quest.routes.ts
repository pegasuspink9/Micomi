import { Router } from "express";
import * as QuestService from "./quest.service";
import * as QuestsController from "../../game/Quests/quests.controller";
import {
  authenticate,
  requirePlayer,
} from "../../../middleware/auth.middleware";

const router = Router();

// Player quest routes
router.get("/player", authenticate, requirePlayer, QuestService.getPlayerQuest);

router.get(
  "/player/quests",
  authenticate,
  requirePlayer,
  QuestService.getPlayerQuestsByPeriodController
);

router.get(
  "/player/daily",
  authenticate,
  requirePlayer,
  QuestService.getPlayerDailyQuestsController
);

// Player claim quest
router.post(
  "/:questId/claim",
  authenticate,
  requirePlayer,
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

router.post("/admin/fill-missing", QuestService.adminFillMissingQuests); //temporary only

router.get("/", QuestService.getAllQuests);
router.get("/:id", QuestService.getQuestById);
router.post("/", QuestService.createQuest);
router.put("/:id", QuestService.updateQuest);
router.delete("/:id", QuestService.deleteQuest);

export default router;
