import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  ShopCharacterCreateInput,
  ShopCharacterUpdateInput,
  ShopPotionCreateInput,
  ShopPotionUpdateInput,
  isPurchasedEdit,
} from "./shop.types";
import { errorResponse, successResponse } from "../../../utils/response";

const prisma = new PrismaClient();

/* GET all characters in shop */
export const getAllCharactersInShop = async (req: Request, res: Response) => {
  try {
    const charactersInShop = await prisma.characterShop.findMany({
      include: { character: true },
    });
    return successResponse(res, charactersInShop, "Characters in shop fetched");
  } catch (error) {
    return errorResponse(res, null, "Characters in shop not found", 404);
  }
};

/* GET all player characters */
export const getAllPlayerCharacter = async (req: Request, res: Response) => {
  const playerId = (req as any).user.id;

  try {
    const player = await prisma.player.findUnique({
      where: { player_id: playerId },
      select: {
        player_id: true,
        username: true,
        coins: true,
      },
    });

    if (!player) {
      return errorResponse(res, null, "Player not found", 404);
    }

    const allCharacters = await prisma.character.findMany({
      include: {
        characterShop: {
          select: {
            character_shop_id: true,
            character_price: true,
          },
        },
      },
    });

    const ownedCharacters = await prisma.playerCharacter.findMany({
      where: { player_id: playerId },
      include: {
        character: {
          include: {
            characterShop: {
              select: {
                character_shop_id: true,
                character_price: true,
              },
            },
          },
        },
      },
    });

    const combinedData = allCharacters.map((character) => {
      const owned = ownedCharacters.find(
        (pc) => pc.character_id === character.character_id,
      );

      const shopInfo =
        character.characterShop || owned?.character.characterShop;

      const damageArray = Array.isArray(character.character_damage)
        ? (character.character_damage as number[])
        : [10, 15, 25];

      const characterCards = getCharacterCards(
        character.character_name,
        damageArray,
      );

      const baseItem = {
        character_shop_id: shopInfo?.character_shop_id ?? null,
        player_id: player.player_id,
        character_id: character.character_id,
        is_purchased: owned?.is_purchased ?? false,
        is_selected: owned?.is_selected ?? false,
        character_price: shopInfo?.character_price ?? null,
        player,
        character: {
          ...character,
          characterShop: undefined,
          cards: characterCards,
        },
        audio: "https://micomi-assets.me/Sounds/Final/Shop.ogg",
      };

      if (owned) {
        (baseItem as any)["player_character_id"] = owned.player_character_id;
      }

      return baseItem;
    });

    const sortedData = combinedData.sort(
      (a, b) => a.character_id - b.character_id,
    );

    return successResponse(res, sortedData, "Player characters fetched");
  } catch (error) {
    console.error(error);
    return errorResponse(res, null, "Failed to fetch player characters", 500);
  }
};

const getCharacterCards = (characterName: string, damage: number[]) => {
  const basicDmg = damage[0] ?? 10;
  const secondDmg = damage[1] ?? 15;
  const thirdDmg = damage[2] ?? 25;
  const specialDmg = "Passive Damage";

  const characterCardsData: Record<string, any[]> = {
    Gino: [
      {
        attack_type: "Special Attack",
        damage_attack: specialDmg,
        card_type: "Stormfang Surge",
        character_attack_card:
          "https://micomi-assets.me/Icons/Skill%20Icons/4th.png",
      },
      {
        attack_type: "Third Attack",
        damage_attack: thirdDmg,
        card_type: "Feral Slash",
        character_attack_card:
          "https://micomi-assets.me/Icons/Skill%20Icons/3rd.png",
      },
      {
        attack_type: "Second Attack",
        damage_attack: secondDmg,
        card_type: "Ruthless Fang",
        character_attack_card:
          "https://micomi-assets.me/Icons/Skill%20Icons/2nd.png",
      },
      {
        attack_type: "Basic Attack",
        damage_attack: basicDmg,
        card_type: "Wild Claw",
        character_attack_card:
          "https://micomi-assets.me/Icons/Skill%20Icons/1st.png",
      },
    ],
    ShiShi: [
      {
        attack_type: "Special Attack",
        damage_attack: specialDmg,
        card_type: "Icebound Meteoclaw",
        character_attack_card:
          "https://micomi-assets.me/Icons/Skill%20Icons/Special%20Attack%20Card.png",
      },
      {
        attack_type: "Third Attack",
        damage_attack: thirdDmg,
        card_type: "Sparkclaw Cascade",
        character_attack_card:
          "https://micomi-assets.me/Icons/Skill%20Icons/Third%20Attack%20Card.png",
      },
      {
        attack_type: "Second Attack",
        damage_attack: secondDmg,
        card_type: "Flamewhisker Crash",
        character_attack_card:
          "https://micomi-assets.me/Icons/Skill%20Icons/Second%20Attack%20Card.png",
      },
      {
        attack_type: "Basic Attack",
        damage_attack: basicDmg,
        card_type: "Voidflare Drop",
        character_attack_card:
          "https://micomi-assets.me/Icons/Skill%20Icons/Basic%20Attack%20Card.png",
      },
    ],
    Ryron: [
      {
        attack_type: "Special Attack",
        damage_attack: specialDmg,
        card_type: "God’s Judgment",
        character_attack_card:
          "https://micomi-assets.me/Icons/Skill%20Icons/Ryron%20Ult.png",
      },
      {
        attack_type: "Third Attack",
        damage_attack: thirdDmg,
        card_type: "Ether Lance",
        character_attack_card:
          "https://micomi-assets.me/Icons/Skill%20Icons/Ryron%20Special.png",
      },
      {
        attack_type: "Second Attack",
        damage_attack: secondDmg,
        card_type: "Void Piercer",
        character_attack_card:
          "https://micomi-assets.me/Icons/Skill%20Icons/Ryron%202nd.png",
      },
      {
        attack_type: "Basic Attack",
        damage_attack: basicDmg,
        card_type: "Velocity Shot",
        character_attack_card:
          "https://micomi-assets.me/Icons/Skill%20Icons/Ryron%20Basic.png",
      },
    ],
    Leon: [
      {
        attack_type: "Special Attack",
        damage_attack: specialDmg,
        card_type: "Inferno Bulwark",
        character_attack_card:
          "https://micomi-assets.me/Icons/Skill%20Icons/Leon%20Ult.png",
      },
      {
        attack_type: "Third Attack",
        damage_attack: thirdDmg,
        card_type: "Cataclysm Break",
        character_attack_card:
          "https://micomi-assets.me/Icons/Skill%20Icons/Leon%20Special.png",
      },
      {
        attack_type: "Second Attack",
        damage_attack: secondDmg,
        card_type: "Molten Strike",
        character_attack_card:
          "https://micomi-assets.me/Icons/Skill%20Icons/Leon%20Basic%20Final.png",
      },
      {
        attack_type: "Basic Attack",
        damage_attack: basicDmg,
        card_type: "Thunderbound Cleaver",
        character_attack_card:
          "https://micomi-assets.me/Icons/Skill%20Icons/Leon%202nd%20Final.png",
      },
    ],
  };

  return characterCardsData[characterName] || [];
};

/* POST a Character in a shop */
export const createShopCharacter = async (req: Request, res: Response) => {
  try {
    const data: ShopCharacterCreateInput = req.body;
    const newCharacter = await prisma.characterShop.create({ data });
    return successResponse(
      res,
      newCharacter,
      "Character in the shop created",
      201,
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      "Failed to create character in the shop",
      400,
    );
  }
};

/* PUT a character in the shop by ID */
export const updateShopCharacter = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const updated = await prisma.characterShop.update({
      where: { character_shop_id: id },
      data: req.body as ShopCharacterUpdateInput,
    });
    return successResponse(res, updated, "Character in a shop updated");
  } catch (error) {
    return errorResponse(
      res,
      error,
      "Failed to update the character in the shop",
      400,
    );
  }
};

/* DELETE a character in the shop by ID */
export const deleteShopCharacter = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.characterShop.delete({ where: { character_shop_id: id } });
    return successResponse(res, null, "Character in the shop deleted");
  } catch (error) {
    return errorResponse(
      res,
      null,
      "Failed to delete character in the shop",
      400,
    );
  }
};

/* GET all potions in shop */
export const getAllPotionsInShop = async (req: Request, res: Response) => {
  try {
    const potionsInShop = await prisma.potionShop.findMany();
    return successResponse(res, potionsInShop, "Potions in shop fetched");
  } catch (error) {
    return errorResponse(res, null, "Potions in shop not found", 404);
  }
};

/* GET all player potions */
export const getAllPlayerPotions = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user.id;

    const allPotions = await prisma.potionShop.findMany({
      include: {
        buyers: {
          where: { player_id: playerId },
        },
      },
    });

    const player = await prisma.player.findUnique({
      where: { player_id: playerId },
      select: {
        player_id: true,
        player_name: true,
        coins: true,
      },
    });

    const formatted = allPotions.map((potion) => {
      const playerPotion = potion.buyers[0];
      return {
        player_potion_id: playerPotion?.player_potion_id ?? null,
        potion_shop_id: potion.potion_shop_id,
        potion_name: potion.potion_name,
        potion_type: potion.potion_type,
        potion_description: potion.potion_description,
        potion_price: potion.potion_price,
        potion_url: potion.potion_url,
        quantity: playerPotion?.quantity ?? 0,
      };
    });

    return successResponse(
      res,
      {
        player_info: {
          player_id: player?.player_id,
          player_name: player?.player_name,
          coins: player?.coins,
        },
        potions: formatted,
      },
      "Player potions fetched",
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, null, "Failed to fetch player potions", 500);
  }
};

/* POST a Potion in the shop */
export const createPotion = async (req: Request, res: Response) => {
  try {
    const data: ShopPotionCreateInput[] = req.body;
    const newPotion = await prisma.potionShop.createMany({ data });
    return successResponse(res, newPotion, "Potion in the shop created", 201);
  } catch (error) {
    return errorResponse(res, null, "Failed to create potion in the shop", 400);
  }
};

/* PUT a Potion in the shop by ID */
export const updatePotion = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const updated = await prisma.potionShop.update({
      where: { potion_shop_id: id },
      data: req.body as ShopPotionUpdateInput,
    });
    return successResponse(res, updated, "Potion in the shop updated");
  } catch (error) {
    return errorResponse(
      res,
      error,
      "Failed to update the potion in the shop",
      400,
    );
  }
};

/* DELETE a potion in the shop by ID */
export const deletePotion = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.potionShop.delete({ where: { potion_shop_id: id } });
    return successResponse(res, null, "Potion in the shop deleted");
  } catch (error) {
    return errorResponse(res, null, "Failed to delete potion in the shop", 400);
  }
};
