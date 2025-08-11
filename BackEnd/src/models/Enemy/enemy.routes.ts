import express from "express";
import * as EnemyController from "./enemy.controller";

const router = express.Router();

router.get("/", EnemyController.getAllEnemies);
router.get("/:id", EnemyController.getEnemyById);
router.post("/", EnemyController.createEnemy);
router.put("/:id", EnemyController.updateEnemy);
router.delete("/:id", EnemyController.deleteEnemy);

export default router;
