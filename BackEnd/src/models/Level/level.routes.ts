import express from "express";
import * as LevelController from "./level.controller";

const router = express.Router();

router.get("/", LevelController.getAllLevels);
router.get("/:id", LevelController.getLevelByID);
router.post("/", LevelController.createLevel);
router.put("/:id", LevelController.updateLevel);
router.delete("/:id", LevelController.deleteLevel);

export default router;
