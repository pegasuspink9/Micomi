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

// Get store catalog (currencies, maps, characters, bundles)
router.get(
  "/catalog",
  authenticate,
  requirePlayer,
  requireAdmin,
  ShopService.getStoreCatalog,
);

//Get all characters in the shop
router.get(
  "/character",
  authenticate,
  requirePlayer,
  requireAdmin,
  ShopService.getAllCharactersInShop,
);
//Character selection
router.post(
  "/select-character/:characterId",
  authenticate,
  requirePlayer,
  CharacterService.selectCharacter,
);

//CRUD for shop characters
router.post(
  "/create-character",
  authenticate,
  requireAdmin,
  ShopService.createShopCharacter,
);
router.put(
  "/update-character/:id",
  authenticate,
  requireAdmin,
  ShopService.updateShopCharacter,
);
router.delete(
  "/delete-character/:id",
  authenticate,
  requireAdmin,
  ShopService.deleteShopCharacter,
);

//Get all potions in the shop
router.get(
  "/potion",
  authenticate,
  requirePlayer,
  requireAdmin,
  ShopService.getAllPotionsInShop,
);
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
router.post(
  "/create-potion",
  authenticate,
  requireAdmin,
  ShopService.createPotion,
);
router.put(
  "/update-potion/:id",
  authenticate,
  requireAdmin,
  ShopService.updatePotion,
);
router.delete(
  "/delete-potion/:id",
  authenticate,
  requireAdmin,
  ShopService.deletePotion,
);

export default router;
