import { Router } from "express";
import * as ShopService from "./shop.service";
import * as CharacterService from "../../game/Characters/characters.controller";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = Router();

//Get all characters in the shop
router.get("/character", ShopService.getAllCharactersInShop);
//Get player characters
router.get("/player-characters/:playerId", ShopService.getAllPlayerCharacter);
//Character selection
router.post("/select-character/:playerId", CharacterService.selectCharacter);

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

//temporary
router.put(
  "/update-isPurchased/:playerCharacterId",
  ShopService.editIsPurchased
);

export default router;
