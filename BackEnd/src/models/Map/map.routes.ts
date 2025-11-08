import express from "express";
import * as MapService from "./map.service";
import * as GameMapController from "../../game/Maps/maps.controller";
import * as LevelService from "../Level/level.service";
import {
  authenticate,
  requireAdmin,
  requirePlayer,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", MapService.getAllMaps);
router.post("/", MapService.createMap);
router.put("/:id", MapService.updateMap);
router.delete("/:id", MapService.deleteMap);

router.post("/select-map/:playerId/:mapId", GameMapController.selectMap); //player map selection
router.get(
  "/select-map/:map_id/select-level/:level_id",
  LevelService.getLevelChallenges
);

export default router;
