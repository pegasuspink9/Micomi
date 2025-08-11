import express from "express";
import * as MapController from "./map.controller";

const router = express.Router();

router.get("/", MapController.getAllMaps);
router.get("/:id", MapController.getMapById);
router.post("/", MapController.createMap);
router.put("/:id", MapController.updateMap);
router.delete("/:id", MapController.deleteMap);

export default router;
