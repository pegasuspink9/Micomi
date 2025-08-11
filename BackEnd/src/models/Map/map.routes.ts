import express from "express";
import * as MapController from "./map.controller";
import * as LevelController from "../Level/level.controller";

const router = express.Router();

router.get("/", MapController.getAllMaps);
router.post("/", MapController.createMap);
router.put("/:id", MapController.updateMap);
router.delete("/:id", MapController.deleteMap);

router.get("/select-map/:id", MapController.getMapById);
router.get(
  "/select-map/:map_id/select-level/:level_id",
  LevelController.getLevelChallenges
);

export default router;
