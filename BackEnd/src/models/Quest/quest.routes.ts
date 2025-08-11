import { Router } from "express";
import * as QuestController from "./quest.controller";

const router = Router();

router.post("/", QuestController.createTemplate);
router.get("/", QuestController.getAllTemplates);
router.get("/:id", QuestController.getTemplateById);
router.put("/:id", QuestController.updateTemplate);
router.delete("/:id", QuestController.deleteTemplate);

export default router;
