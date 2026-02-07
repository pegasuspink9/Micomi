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

router.get("/maps", MapService.getAllMaps);
router.post("/", MapService.createMap);
router.put("/:id", MapService.updateMap);
router.delete("/:id", MapService.deleteMap);

router.get("/", authenticate, requirePlayer, MapService.getAllMapsByPlayerId); //player map display
router.post(
  "/select-map/:mapId",
  authenticate,
  requirePlayer,
  GameMapController.selectMap,
); //player map selection

export default router;
