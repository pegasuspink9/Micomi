import express from "express";
import * as LevelService from "./level.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", authenticate, requireAdmin, LevelService.getAllLevels);
router.get("/:id", authenticate, requireAdmin, LevelService.getLevelById);
router.post("/", authenticate, requireAdmin, LevelService.createLevel);
router.put("/:id", authenticate, requireAdmin, LevelService.updateLevel);
router.delete("/:id", authenticate, requireAdmin, LevelService.deleteLevel);

export default router;
