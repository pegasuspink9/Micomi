import express from "express";
import * as EnemyService from "./enemy.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", EnemyService.getAllEnemies);
router.get("/:id", EnemyService.getEnemyById);
router.post("/", EnemyService.createEnemy);
router.put("/:id", EnemyService.updateEnemy);
router.delete("/:id", EnemyService.deleteEnemy);

export default router;
