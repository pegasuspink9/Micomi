import express from "express";
import * as DialogueService from "./dialogue.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", authenticate, requireAdmin, DialogueService.getAllDialogue);
router.get("/:id", authenticate, requireAdmin, DialogueService.getDialogueById);
router.post("/", authenticate, requireAdmin, DialogueService.createDialogue);
router.put("/:id", authenticate, requireAdmin, DialogueService.updateDialogue);
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  DialogueService.deleteDialogue,
);

export default router;
