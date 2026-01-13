import express from "express";
import * as PlayerController from "./player.controller";
import {
  authenticate,
  requireAdmin,
  requirePlayer,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.post("/login", PlayerController.loginPlayer);
router.post("/register", PlayerController.createPlayer);

router.get(
  "/profile",
  authenticate,
  requirePlayer,
  PlayerController.getPlayerProfile
);

router.put(
  "/profile",
  authenticate,
  requirePlayer,
  PlayerController.updatePlayerProfile
);

router.get("/", PlayerController.getPlayers);
router.get("/:id", PlayerController.getPlayerById);
router.put("/:id", authenticate, requireAdmin, PlayerController.updatePlayer);
router.delete("/:id", PlayerController.deletePlayer);

export default router;
