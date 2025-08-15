import { PrismaClient } from "@prisma/client";
import {
  ShopCharacterCreateInput,
  ShopCharacterUpdateInput,
  ShopPotionCreateInput,
  ShopPotionUpdateInput,
} from "./shop.types";

const prisma = new PrismaClient();

/* Character Shop */
export const getAllCharactersInShop = async () => {
  return prisma.characterShop.findMany();
};

export const getAllPlayerCharacter = async () => {
  return prisma.playerCharacter.findMany({
    include: { player: true, character: true },
  });
};

export const createShopCharacter = async (data: ShopCharacterCreateInput) => {
  return prisma.characterShop.create({ data });
};

export const updateShopCharacter = async (
  id: number,
  data: ShopCharacterUpdateInput
) => {
  return prisma.characterShop.update({
    where: { character_shop_id: id },
    data,
  });
};

export const deleteShopCharacter = async (id: number) => {
  return prisma.characterShop.delete({ where: { character_shop_id: id } });
};

/* Potion Shop */
export const getAllPotionsInShop = async () => {
  return prisma.potionShop.findMany();
};

export const getAllPlayerPotions = async () => {
  return prisma.playerPotion.findMany({
    include: { player: true, potion: true },
  });
};

export const createPotion = async (data: ShopPotionCreateInput) => {
  return prisma.potionShop.create({ data });
};

export const updatePotion = async (id: number, data: ShopPotionUpdateInput) => {
  return prisma.potionShop.update({ where: { potion_shop_id: id }, data });
};

export const deletePotion = async (id: number) => {
  return prisma.potionShop.delete({ where: { potion_shop_id: id } });
};
