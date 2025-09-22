import { Router } from "express";
import * as ShopService from "./shop.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = Router();

//Get all characters in the shop
router.get("/shop-characters", ShopService.getAllCharactersInShop);
//Get player characters
router.get("/player-characters/:playerId", ShopService.getAllPlayerCharacter);

//CRUD for shop characters
router.post("/create-character", ShopService.createShopCharacter);
router.put("/update-character/:id", ShopService.updateShopCharacter);
router.delete("/delete-character/:id", ShopService.deleteShopCharacter);

//Get all potions in the shop
router.get("/potions", ShopService.getAllPotionsInShop);
//Get all player potions
router.get("/potions/:playerId", ShopService.getAllPlayerPotions);

// CRUD potions in the shop
router.post("/create-potion", ShopService.createPotion);
router.put("/update-potion/:id", ShopService.updatePotion);
router.delete("/delete-potion/:id", ShopService.deletePotion);

export default router;
