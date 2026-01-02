import express from "express";
import * as DialogueService from "./dialogue.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", DialogueService.getAllDialogue);
router.get("/:id", DialogueService.getDialogueById);
router.post("/", DialogueService.createDialogue);
router.put("/:id", DialogueService.updateDialogue);
router.delete("/:id", DialogueService.deleteDialogue);

export default router;
