import { Router } from "express";
import * as QuestService from "./quest.service";
import * as QuesController from "../../game/Quests/quests.controller";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = Router();

router.get("/", QuestService.getAllQuests);
router.get("/:id", QuestService.getQuestById);
router.post("/", QuestService.createQuest);
router.put("/:id", QuestService.updateQuest);
router.delete("/:id", QuestService.deleteQuest);

router.get("/:playerId", QuestService.getPlayerQuest);
router.post(
  "/:playerId/:questId/claim",
  QuesController.claimQuestRewardController
);

export default router;
