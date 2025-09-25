import express from "express";
import * as LevelPotionShopService from "./levelPotionShop.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", LevelPotionShopService.getAllLevelPotionShops);
router.get("/:id", LevelPotionShopService.getLevelPotionShopById);
router.post("/", LevelPotionShopService.createLevelPotionShop);
router.put("/:id", LevelPotionShopService.updateLevelPotionShop);
router.delete("/:id", LevelPotionShopService.deleteLevelPotionShop);

export default router;
