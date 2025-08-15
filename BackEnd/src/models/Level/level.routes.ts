import express from "express";
import * as LevelController from "./level.controller";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", authenticate, LevelController.getAllLevels);
router.get("/:id", authenticate, LevelController.getLevelByID);
router.post("/", authenticate, requireAdmin, LevelController.createLevel);
router.put("/:id", authenticate, requireAdmin, LevelController.updateLevel);
router.delete("/:id", authenticate, requireAdmin, LevelController.deleteLevel);

export default router;
