import { Router } from "express";
import * as ShopService from "./shop.service";
import * as CharacterService from "../../game/Characters/characters.controller";
import { buyPotionInShop } from "../../game/Shop/shop.service";
import {
  authenticate,
  requireAdmin,
  requirePlayer,
} from "../../../middleware/auth.middleware";

const router = Router();

//Get all characters in the shop
router.get("/character", ShopService.getAllCharactersInShop);
//Character selection
router.post(
  "/select-character/:characterId",
  authenticate,
  requirePlayer,
  CharacterService.selectCharacter,
);

//CRUD for shop characters
router.post("/create-character", ShopService.createShopCharacter);
router.put("/update-character/:id", ShopService.updateShopCharacter);
router.delete("/delete-character/:id", ShopService.deleteShopCharacter);

//Get all potions in the shop
router.get("/potion", ShopService.getAllPotionsInShop);
//Get all player potions (Potion Shop)
router.get(
  "/potions",
  authenticate,
  requirePlayer,
  ShopService.getAllPlayerPotions,
);
router.post(
  "/buy-potion/:potionShopId",
  authenticate,
  requirePlayer,
  buyPotionInShop,
);

// CRUD potions in the shop
router.post("/create-potion", ShopService.createPotion);
router.put("/update-potion/:id", ShopService.updatePotion);
router.delete("/delete-potion/:id", ShopService.deletePotion);

export default router;
