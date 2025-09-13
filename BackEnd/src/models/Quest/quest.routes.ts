import { Router } from "express";
import * as QuestService from "./quest.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = Router();

router.post("/", QuestService.createTemplate);
router.get("/", QuestService.getAllTemplates);
router.get("/:id", QuestService.getTemplateById);
router.put("/:id", QuestService.updateTemplate);
router.delete("/:id", QuestService.deleteTemplate);

export default router;
