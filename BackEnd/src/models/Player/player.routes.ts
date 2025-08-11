import express from "express";
import * as PlayerController from "./player.controller";

const router = express.Router();

router.post("/login", PlayerController.loginPlayer);

router.get("/", PlayerController.getPlayers);
router.get("/:id", PlayerController.getPlayerById);
router.post("/register", PlayerController.createPlayer);
router.put("/:id", PlayerController.updatePlayer);
router.delete("/:id", PlayerController.deletePlayer);

export default router;
