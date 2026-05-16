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
  PlayerController.getPlayerProfile,
);

router.put(
  "/profile",
  authenticate,
  requirePlayer,
  PlayerController.updatePlayerProfile,
);

router.get("/", authenticate, PlayerController.getPlayers);
router.get(
  "/search",
  authenticate,
  requirePlayer,
  PlayerController.searchPlayersByUsername,
);
router.get(
  "/:id",
  authenticate,
  requirePlayer,
  requireAdmin,
  PlayerController.getPlayerById,
);
router.put("/:id", authenticate, requireAdmin, PlayerController.updatePlayer);
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  PlayerController.deletePlayer,
);

export default router;
