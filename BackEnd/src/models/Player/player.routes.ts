import express from "express";
import * as PlayerController from "./player.controller";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.post("/login", PlayerController.loginPlayer);

router.get("/", authenticate, PlayerController.getPlayers);
router.get("/:id", authenticate, PlayerController.getPlayerById);
router.post("/register", PlayerController.createPlayer);
router.put("/:id", authenticate, requireAdmin, PlayerController.updatePlayer);
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  PlayerController.deletePlayer
);

export default router;
