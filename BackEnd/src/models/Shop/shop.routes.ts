import { Router } from "express";
import * as ShopController from "./shop.controller";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = Router();

//Get all characters in the shop
router.get(
  "/shop-characters",
  authenticate,
  ShopController.getAllCharactersInShop
);
//Get player characters
router.get(
  "/player-characters",
  authenticate,
  ShopController.getAllPlayerCharacter
);

//CRUD for shop characters
router.post(
  "/create-character",
  authenticate,
  requireAdmin,
  ShopController.createShopCharacter
);
router.put(
  "/update-character/:id",
  authenticate,
  requireAdmin,
  ShopController.updateShopCharacter
);
router.delete(
  "/delete-character/:id",
  authenticate,
  requireAdmin,
  ShopController.deleteShopCharacter
);

//Get all potions in the shop
router.get("/potions", authenticate, ShopController.getAllPotionsInShop);
//Get all player potions
router.get("/potions/player", authenticate, ShopController.getAllPlayerPotions);

// CRUD potions in the shop
router.post(
  "/create-potion",
  authenticate,
  requireAdmin,
  ShopController.createPotion
);
router.put(
  "/update-potion/:id",
  authenticate,
  requireAdmin,
  ShopController.updatePotion
);
router.delete(
  "/delete-potion/:id",
  authenticate,
  requireAdmin,
  ShopController.deletePotion
);

export default router;
