import express from "express";
import * as MapService from "./map.service";
import * as LevelService from "../Level/level.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", MapService.getAllMaps);
router.post("/", MapService.createMap);
router.put("/:id", MapService.updateMap);
router.delete("/:id", MapService.deleteMap);

router.get("/select-map/:id", MapService.getMapById);
router.get(
  "/select-map/:map_id/select-level/:level_id",
  LevelService.getLevelChallenges
);

export default router;
