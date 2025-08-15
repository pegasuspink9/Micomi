import express from "express";
import * as MapController from "./map.controller";
import * as LevelController from "../Level/level.controller";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", authenticate, MapController.getAllMaps);
router.post("/", authenticate, requireAdmin, MapController.createMap);
router.put("/:id", authenticate, requireAdmin, MapController.updateMap);
router.delete("/:id", authenticate, requireAdmin, MapController.deleteMap);

router.get("/select-map/:id", MapController.getMapById);
router.get(
  "/select-map/:map_id/select-level/:level_id",
  LevelController.getLevelChallenges
);

export default router;
