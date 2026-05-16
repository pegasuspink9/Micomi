import express from "express";
import * as EnemyService from "./enemy.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", authenticate, requireAdmin, EnemyService.getAllEnemies);
router.get("/:id", authenticate, requireAdmin, EnemyService.getEnemyById);
router.post("/", authenticate, requireAdmin, EnemyService.createEnemy);
router.put("/:id", authenticate, requireAdmin, EnemyService.updateEnemy);
router.delete("/:id", authenticate, requireAdmin, EnemyService.deleteEnemy);

export default router;
