import { PrismaClient, ShopItemType } from "@prisma/client";
import { ShopCreateInput, ShopUpdateInput } from "./shop.types";

const prisma = new PrismaClient();

export const getAllShop = async () => {
  return prisma.shop.findMany();
};

export const getShopById = async (id: number) => {
  return prisma.shop.findUnique({ where: { shop_id: id } });
};

export const createShop = async (data: ShopCreateInput) => {
  const isPotion =
    data.item_type === ShopItemType.potion &&
    data.potion_type !== undefined &&
    data.potion_price !== undefined &&
    data.potion_health_boost !== undefined &&
    data.potion_description !== undefined;

  const isCharacter =
    data.item_type === ShopItemType.character &&
    data.character_id !== undefined &&
    data.character_price !== undefined;

  if (!isPotion && !isCharacter) {
    throw new Error("Must provide valid fields for either potion or character");
  }

  if (isPotion && isCharacter) {
    throw new Error("Cannot create shop item as both potion and character");
  }

  return prisma.shop.create({ data });
};

export const updateShop = async (id: number, data: ShopUpdateInput) => {
  return prisma.shop.update({ where: { shop_id: id }, data });
};

export const deleteShop = async (id: number) => {
  return prisma.shop.delete({ where: { shop_id: id } });
};
