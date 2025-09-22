import express from "express";
import * as LevelService from "./level.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", LevelService.getAllLevels);
router.get("/:id", LevelService.getLevelById);
router.post("/", LevelService.createLevel);
router.put("/:id", LevelService.updateLevel);
router.delete("/:id", LevelService.deleteLevel);

export default router;
