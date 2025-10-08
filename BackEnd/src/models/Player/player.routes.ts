import express from "express";
import * as PlayerController from "./player.controller";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.post("/login", PlayerController.loginPlayer);

router.get("/", PlayerController.getPlayers);
router.get("/:id", PlayerController.getPlayerById);
router.get("/profile/:id", PlayerController.getPlayerProfile);
router.post("/register", PlayerController.createPlayer);
router.put("/:id", PlayerController.updatePlayer);
router.delete("/:id", PlayerController.deletePlayer);

export default router;
