import { Request, Response } from "express";
import * as ShopService from "./shop.service";
import { errorResponse, successResponse } from "../../../utils/response";

/* GET all characters in shop */
export const getAllCharactersInShop = async (req: Request, res: Response) => {
  try {
    const charactersInShop = await ShopService.getAllCharactersInShop();
    return successResponse(res, charactersInShop, "Characters in shop fetched");
  } catch (error) {
    return errorResponse(res, null, "Characters in shop not found", 404);
  }
};

/* GET all player characters */
export const getAllPlayerCharacter = async (req: Request, res: Response) => {
  try {
    const playerCharacters = await ShopService.getAllPlayerCharacter();
    return successResponse(res, playerCharacters, "Player characters fetched");
  } catch (error) {
    return errorResponse(res, null, "Player characters not found", 404);
  }
};

/* POST a Character in a shop */
export const createShopCharacter = async (req: Request, res: Response) => {
  try {
    const data = await ShopService.createShopCharacter(req.body);
    return successResponse(res, data, "Character in the shop created", 201);
  } catch (error) {
    return errorResponse(
      res,
      null,
      "Failed to create character in the shop",
      400
    );
  }
};

/* PUT a character in the shop by ID */
export const updateShopCharacter = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const shop = await ShopService.updateShopCharacter(id, req.body);
    return successResponse(res, shop, "Character in a shop updated");
  } catch (error) {
    return errorResponse(
      res,
      null,
      "Failed to update the character in the shop",
      400
    );
  }
};

/* DELETE a character in the shop by ID */
export const deleteShopCharacter = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await ShopService.deleteShopCharacter(id);
    return successResponse(res, null, "Character in the shop deleted");
  } catch (error) {
    return errorResponse(
      res,
      null,
      "Failed to delete character in the shop",
      400
    );
  }
};

/* GET all potions in shop */
export const getAllPotionsInShop = async (req: Request, res: Response) => {
  try {
    const potionsInShop = await ShopService.getAllPotionsInShop();
    return successResponse(res, potionsInShop, "Potions in shop fetched");
  } catch (error) {
    return errorResponse(res, null, "Potions in shop not found", 404);
  }
};

/* GET all player potions */
export const getAllPlayerPotions = async (req: Request, res: Response) => {
  try {
    const playerPotions = await ShopService.getAllPlayerPotions();
    return successResponse(res, playerPotions, "Player potions fetched");
  } catch (error) {
    return errorResponse(res, null, "Player potions not found", 404);
  }
};

/* POST a Potion in the shop */
export const createPotion = async (req: Request, res: Response) => {
  try {
    const data = await ShopService.createPotion(req.body);
    return successResponse(res, data, "Potion in the shop created", 201);
  } catch (error) {
    return errorResponse(res, null, "Failed to create potion in the shop", 400);
  }
};

/* PUT a Potion in the shop by ID */
export const updatePotion = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const shop = await ShopService.updatePotion(id, req.body);
    return successResponse(res, shop, "Potion in the shop updated");
  } catch (error) {
    return errorResponse(
      res,
      null,
      "Failed to update the potion in the shop",
      400
    );
  }
};

/* DELETE a potion in the shop by ID */
export const deletePotion = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await ShopService.deletePotion(id);
    return successResponse(res, null, "Potion in the shop deleted");
  } catch (error) {
    return errorResponse(res, null, "Failed to delete potion in the shop", 400);
  }
};
